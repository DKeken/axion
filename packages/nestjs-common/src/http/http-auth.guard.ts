import {
  AUTH_SERVICE_NAME,
  AUTH_SERVICE_PATTERNS,
  Status,
  type RequestMetadata,
  type ValidateSessionResponse,
} from "@axion/contracts";
import { createRequestMetadata } from "@axion/shared";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  Inject,
  Optional,
  type OnModuleInit,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ClientKafka } from "@nestjs/microservices";
import { firstValueFrom, timeout } from "rxjs";

import { ALLOW_ANONYMOUS_KEY } from "../auth/auth.decorator";

type HttpRequest = {
  headers: Record<string, string | string[] | undefined>;
  axion?: {
    metadata?: RequestMetadata;
    userId?: string;
    session?: unknown;
  };
};

@Injectable()
export class HttpAuthGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(HttpAuthGuard.name);
  private authServiceClient: ClientKafka | null = null;
  private authServiceResolved = false;
  private authClientConnectFailed = false;

  constructor(
    @Optional()
    @Inject(AUTH_SERVICE_NAME)
    private readonly injectedAuthClient: ClientKafka | undefined,
    @Inject(Reflector)
    private readonly reflector: Reflector
  ) {}

  async onModuleInit() {
    if (this.injectedAuthClient) {
      this.injectedAuthClient.subscribeToResponseOf(
        AUTH_SERVICE_PATTERNS.VALIDATE_SESSION
      );
      // Never block the entire service boot on Kafka connectivity.
      // Connect in background; guard will lazily disable auth if unavailable.
      const isProduction = process.env.NODE_ENV === "production";
      void Promise.race([
        this.injectedAuthClient.connect(),
        new Promise<void>((_, reject) => {
          setTimeout(
            () =>
              reject(new Error("AUTH_SERVICE Kafka client connect timeout")),
            5000
          );
        }),
      ]).catch((error) => {
        this.authClientConnectFailed = true;
        this.logger.warn(
          `HttpAuthGuard: failed to connect AUTH_SERVICE Kafka client (${error instanceof Error ? error.message : String(error)}). ` +
            "Authentication will be disabled until auth-service is reachable."
        );
        if (isProduction) {
          // In prod we still want a hard fail - surface as unhandled rejection.
          throw error;
        }
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== "http") {
      return true;
    }

    const allowAnonymous = this.reflector.getAllAndOverride<boolean>(
      ALLOW_ANONYMOUS_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (allowAnonymous) {
      return true;
    }

    // Lazily resolve auth service client on first use
    if (!this.authServiceResolved) {
      this.authServiceClient = this.authClientConnectFailed
        ? null
        : this.injectedAuthClient || null;
      this.authServiceResolved = true;

      if (!this.authServiceClient) {
        this.logger.warn(
          "HttpAuthGuard: AUTH_SERVICE client not available - authentication will be disabled"
        );
      }
    }

    // If auth service is not available, allow request (authentication disabled)
    if (!this.authServiceClient) {
      return true;
    }

    const req = context.switchToHttp().getRequest<HttpRequest>();

    // Convert headers to the string-only map
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers ?? {})) {
      if (!value) continue;
      headers[key] = Array.isArray(value) ? value[0] : value;
    }

    // Extract session token from Authorization header or cookie
    const authHeader = headers.authorization || headers.Authorization;
    let sessionToken: string | undefined;

    if (authHeader) {
      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
      if (bearerMatch?.[1]) {
        sessionToken = bearerMatch[1];
      }
    }

    // If no Bearer token, try cookie (better-auth stores session token in cookie)
    if (!sessionToken && headers.cookie) {
      const cookieMatch = headers.cookie.match(
        /better-auth\.session_token=([^;]+)/
      );
      if (cookieMatch?.[1]) {
        sessionToken = cookieMatch[1];
      }
    }

    if (!sessionToken) {
      throw new UnauthorizedException("Missing session token");
    }

    try {
      // Validate session using auth-service via Kafka
      const response = await firstValueFrom(
        this.authServiceClient
          .send<ValidateSessionResponse>(
            AUTH_SERVICE_PATTERNS.VALIDATE_SESSION,
            { sessionToken }
          )
          .pipe(timeout(10000)) // 10 second timeout
      );

      // Check response status (Protobuf contract format)
      if (!response || response.status !== Status.STATUS_SUCCESS) {
        const errorMessage =
          response?.error?.message || "Invalid or expired session";
        throw new UnauthorizedException(errorMessage);
      }

      // Extract session data from oneof result
      if (!response.session) {
        throw new UnauthorizedException("Session data not found in response");
      }

      const userId = response.session.userId;
      if (!userId) {
        throw new UnauthorizedException("Session does not contain user id");
      }

      // Store minimal request context for controllers → domain services.
      req.axion = {
        userId,
        session: response.session,
        metadata: createRequestMetadata(userId),
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error("Error validating authentication", error);
      throw new UnauthorizedException("Authentication failed");
    }
  }
}
