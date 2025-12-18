import { getUserIdFromSession } from "@axion/better-auth";
import { createRequestMetadata } from "@axion/shared";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ModuleRef } from "@nestjs/core";
import type { betterAuth } from "better-auth";

import { ALLOW_ANONYMOUS_KEY } from "../auth/auth.decorator";

import type { RequestMetadata } from "@axion/contracts";

type HttpRequest = {
  headers: Record<string, string | string[] | undefined>;
  axion?: {
    metadata?: RequestMetadata;
    userId?: string;
    session?: unknown;
  };
};

@Injectable()
export class HttpAuthGuard implements CanActivate {
  private readonly logger = new Logger(HttpAuthGuard.name);
  private auth: ReturnType<typeof betterAuth> | null = null;
  private authResolved = false;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector
  ) {}

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

    // Lazily resolve BETTER_AUTH provider on first use (optional dependency)
    if (!this.authResolved) {
      try {
        this.auth = this.moduleRef.get("BETTER_AUTH", { strict: false });
        this.authResolved = true;
        if (!this.auth) {
          this.logger.warn(
            "HttpAuthGuard: BETTER_AUTH not available - authentication will be disabled"
          );
        }
      } catch {
        this.authResolved = true;
        this.logger.warn(
          "HttpAuthGuard: Failed to resolve BETTER_AUTH - authentication will be disabled"
        );
      }
    }

    // If auth is not available, allow request (authentication disabled)
    if (!this.auth) {
      return true;
    }

    const req = context.switchToHttp().getRequest<HttpRequest>();

    // Convert headers to the string-only map better-auth expects.
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers ?? {})) {
      if (!value) continue;
      headers[key] = Array.isArray(value) ? value[0] : value;
    }

    const session = await this.auth.api.getSession({ headers });
    if (!session) {
      throw new UnauthorizedException("Invalid or missing session");
    }

    const userId = getUserIdFromSession(session);
    if (!userId) {
      throw new UnauthorizedException("Session does not contain user id");
    }

    // Store minimal request context for controllers → domain services.
    req.axion = {
      userId,
      session,
      metadata: createRequestMetadata(userId),
    };

    return true;
  }
}

