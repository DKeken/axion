import {
  AUTH_SERVICE_NAME,
  AUTH_SERVICE_PATTERNS,
  Status,
  type ValidateSessionResponse,
} from "@axion/contracts";
import {
  getSessionTokenFromMetadata,
  isValidRequestMetadata,
} from "@axion/shared";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  Inject,
  Optional,
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
export class MicroserviceAuthGuard implements CanActivate {
  private readonly logger = new Logger(MicroserviceAuthGuard.name);
  private authServiceClient: ClientKafka | null = null;
  private authServiceResolved = false;

  constructor(
    @Optional()
    @Inject(AUTH_SERVICE_NAME)
    private readonly injectedAuthClient?: ClientKafka
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lazily resolve auth service client on first use
    if (!this.authServiceResolved) {
      this.authServiceClient = this.injectedAuthClient || null;
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

      // Validate session using auth-service via Kafka
      const response = await firstValueFrom(
        this.authServiceClient
          .send<ValidateSessionResponse>(
            AUTH_SERVICE_PATTERNS.VALIDATE_SESSION,
            { sessionToken }
          )
          .pipe(timeout(5000)) // 5 second timeout
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
