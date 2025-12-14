import {
  getSessionTokenFromMetadata,
  isValidRequestMetadata,
} from "@axion/shared";
import { getUserIdFromSession } from "@axion/better-auth";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import type { betterAuth } from "better-auth";

/**
 * Auth Guard for Kafka/RabbitMQ microservices
 * Validates user session using Better Auth
 *
 * For microservices architecture:
 * - Gateway extracts session token from request
 * - Gateway includes sessionToken in metadata when sending messages
 * - This guard validates the session token using Better Auth API
 * - Guard extracts user_id from validated session
 *
 * The guard uses ModuleRef to lazily resolve BETTER_AUTH provider.
 * If BETTER_AUTH is not available, authentication will be disabled and all requests will be allowed.
 *
 * Usage:
 * ```typescript
 * @Controller()
 * @UseGuards(MicroserviceAuthGuard)
 * export class MyController {}
 * ```
 */
@Injectable()
export class MicroserviceAuthGuard implements CanActivate {
  private readonly logger = new Logger(MicroserviceAuthGuard.name);
  private auth: ReturnType<typeof betterAuth> | null = null;
  private authResolved = false;

  constructor(private readonly moduleRef: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lazily resolve BETTER_AUTH provider on first use
    if (!this.authResolved) {
      try {
        this.auth = this.moduleRef.get("BETTER_AUTH", { strict: false });
        this.authResolved = true;
        if (!this.auth) {
          this.logger.warn(
            "MicroserviceAuthGuard: BETTER_AUTH not available - authentication will be disabled"
          );
        }
      } catch (error) {
        this.logger.warn(
          "MicroserviceAuthGuard: Failed to resolve BETTER_AUTH - authentication will be disabled"
        );
        this.authResolved = true;
      }
    }

    // If auth is not available, allow request (authentication disabled)
    if (!this.auth) {
      this.logger.debug("Authentication disabled - allowing request");
      return true;
    }

    // For Kafka/RabbitMQ microservices, get data from RPC context
    const rpcContext = context.switchToRpc();
    const data = rpcContext.getData();

    if (!data || typeof data !== "object" || !("metadata" in data)) {
      this.logger.warn("Missing metadata in request");
      return false;
    }

    const metadata = data.metadata;

    // Use shared utility to validate metadata
    if (!isValidRequestMetadata(metadata)) {
      this.logger.warn("Invalid metadata format");
      return false;
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

      // Validate session using Better Auth API
      // Better Auth supports Bearer token in authorization header
      // getSession returns null if session is invalid or expired
      const session = await this.auth.api.getSession({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      });

      // Better Auth validates the session - if it's not null, it's valid
      if (!session) {
        this.logger.warn("Invalid or expired session token");
        return false;
      }

      // Extract user ID using Better Auth helper
      const userId = getUserIdFromSession(session);
      if (!userId) {
        this.logger.warn("Session does not contain user ID");
        return false;
      }

      // Update metadata with validated user_id
      // RequestMetadata supports both camelCase and snake_case
      metadata.userId = userId;
      metadata.user_id = userId;
      metadata.session = session; // Store full session for potential use

      return true;
    } catch (error) {
      this.logger.error("Error validating authentication", error);
      return false;
    }
  }
}
