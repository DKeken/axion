import {
  AUTH_SERVICE_NAME,
  AUTH_SERVICE_PATTERNS,
  Status,
  type ValidateSessionResponse,
} from "@axion/contracts";
import { extractMetadata, getSessionTokenFromMetadata } from "@axion/shared";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  Inject,
  Optional,
  type OnModuleInit,
} from "@nestjs/common";
import type { ClientKafka } from "@nestjs/microservices";
import { firstValueFrom, timeout } from "rxjs";

/**
 * Auth Guard for Kafka microservices
 * Validates user session using auth-service via Kafka
 *
 * For microservices architecture:
 * - Gateway extracts session token from request
 * - Gateway includes sessionToken in metadata when sending messages
 * - This guard validates the session token via auth-service (Kafka)
 * - Guard extracts user_id from validated session
 *
 * The guard uses @Inject to get the AUTH_SERVICE_NAME Kafka client.
 * If AUTH_SERVICE_NAME is not available, authentication will be disabled and all requests will be allowed.
 *
 * Usage:
 * ```typescript
 * @Controller()
 * @UseGuards(MicroserviceAuthGuard)
 * export class MyController {}
 * ```
 */
@Injectable()
export class MicroserviceAuthGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(MicroserviceAuthGuard.name);
  private authServiceClient: ClientKafka | null = null;
  private authServiceResolved = false;
  private authClientConnectFailed = false;

  constructor(
    @Optional()
    @Inject(AUTH_SERVICE_NAME)
    private readonly injectedAuthClient?: ClientKafka
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
          `MicroserviceAuthGuard: failed to connect AUTH_SERVICE Kafka client (${error instanceof Error ? error.message : String(error)}). ` +
            "Authentication will be disabled until auth-service is reachable."
        );
        if (isProduction) {
          throw error;
        }
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lazily resolve auth service client on first use
    if (!this.authServiceResolved) {
      this.authServiceClient = this.authClientConnectFailed
        ? null
        : this.injectedAuthClient || null;
      this.authServiceResolved = true;

      if (!this.authServiceClient) {
        this.logger.warn(
          "MicroserviceAuthGuard: AUTH_SERVICE client not available - authentication will be disabled"
        );
      }
    }

    // If auth service is not available, allow request (authentication disabled)
    if (!this.authServiceClient) {
      this.logger.debug("Authentication disabled - allowing request");
      return true;
    }

    // For Kafka microservices, get data from RPC context
    const rpcContext = context.switchToRpc();
    const data = rpcContext.getData();

    // Extract and normalize metadata from payload
    const metadata = extractMetadata(data);

    // If metadata was nested, we want to ensure it's updated in the original object for downstream
    if (data && typeof data === "object" && "metadata" in data) {
      Object.assign(data.metadata, metadata);
    }

    try {
      // Use shared utility to extract session token
      const sessionToken = getSessionTokenFromMetadata(metadata);

      if (!sessionToken) {
        this.logger.warn(
          "Missing session token in metadata. Gateway should include sessionToken."
        );
        return false;
      }

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
        this.logger.warn(
          `Invalid or expired session token: ${response?.error?.message || "unknown error"}`
        );
        return false;
      }

      // Extract session data from oneof result
      if (!response.session) {
        this.logger.warn("Session data not found in response");
        return false;
      }

      const userId = response.session.userId;
      if (!userId) {
        this.logger.warn("Session does not contain user ID");
        return false;
      }

      // Update metadata with validated user_id
      // RequestMetadata supports both camelCase and snake_case
      metadata.userId = userId;
      metadata.user_id = userId;
      metadata.session = response.session; // Store full session for potential use

      return true;
    } catch (error) {
      this.logger.error("Error validating authentication", error);
      return false;
    }
  }
}
