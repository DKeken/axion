import { getUserIdFromSession } from "@axion/better-auth";
import {
  type RequestMetadata,
  createErrorResponse,
  createValidationError,
  AUTH_SERVICE_NAME,
  AUTH_SERVICE_PATTERNS,
  Status,
  type ValidateSessionResponse,
} from "@axion/contracts";
import {
  getSessionTokenFromMetadata,
  getUserIdFromMetadata,
  isValidRequestMetadata,
  normalizeRequestMetadata,
} from "@axion/shared";
import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import type { ClientKafka } from "@nestjs/microservices";
import type { UserSession } from "@thallesp/nestjs-better-auth";
import type { betterAuth } from "better-auth";
import { firstValueFrom, timeout } from "rxjs";

/**
 * Helper for authentication validation in microservices
 * Uses Better Auth for session validation
 */
@Injectable()
export class AuthHelper {
  private readonly logger = new Logger(AuthHelper.name);

  constructor(
    @Optional()
    @Inject("BETTER_AUTH")
    private readonly auth?: ReturnType<typeof betterAuth>,

    @Optional()
    @Inject(AUTH_SERVICE_NAME)
    private readonly authServiceClient?: ClientKafka
  ) {}

  /**
   * Validate session token and return session
   * Fallback to Kafka if direct Better Auth is not available
   */
  async validateSessionToken(
    sessionToken: string | undefined | null
  ): Promise<{ session: UserSession | unknown; userId: string } | null> {
    if (typeof sessionToken !== "string" || !sessionToken) {
      return null;
    }

    // 1. Try direct Better Auth validation if available
    if (this.auth) {
      try {
        // Better Auth supports Bearer token in authorization header
        // getSession returns null if session is invalid or expired
        const session = await this.auth.api.getSession({
          headers: {
            authorization: `Bearer ${sessionToken}`,
          },
        });

        // Better Auth validates the session - if it's not null, it's valid
        if (!session) {
          return null;
        }

        // Extract user ID using Better Auth helper
        const userId = getUserIdFromSession(session);
        if (!userId) {
          return null;
        }

        return {
          session,
          userId,
        };
      } catch (error) {
        this.logger.warn(
          "Error validating session token via Better Auth",
          error
        );
        // Continue to fallback
      }
    }

    // 2. Fallback to Kafka if direct validation failed or is not available
    if (this.authServiceClient) {
      try {
        const response = await firstValueFrom(
          this.authServiceClient
            .send<ValidateSessionResponse>(
              AUTH_SERVICE_PATTERNS.VALIDATE_SESSION,
              { sessionToken }
            )
            .pipe(timeout(5000))
        );

        if (
          response &&
          response.status === Status.STATUS_SUCCESS &&
          response.session
        ) {
          return {
            session: response.session,
            userId: response.session.userId,
          };
        }
      } catch (error) {
        this.logger.error("Error validating session token via Kafka", error);
      }
    }

    if (!this.auth && !this.authServiceClient) {
      this.logger.error(
        "No authentication validation mechanism available (Better Auth or Kafka)"
      );
    }

    return null;
  }

  /**
   * Validate user_id from metadata (after guard validation)
   * In microservices architecture, the guard validates the session
   * and sets user_id in metadata
   */
  validateUserIdFromMetadata(
    metadata: RequestMetadata | unknown
  ): { userId: string } | null {
    if (!metadata || typeof metadata !== "object") {
      this.logger.warn("Missing or invalid metadata");
      return null;
    }

    const userId = getUserIdFromMetadata(metadata);

    if (!userId) {
      this.logger.warn("Missing user_id in metadata");
      return null;
    }

    return { userId };
  }

  /**
   * Validate session token from metadata and return user_id
   */
  async validateSessionFromMetadata(
    metadata: RequestMetadata | unknown
  ): Promise<{ userId: string } | null> {
    // Use shared utility to validate metadata
    if (!isValidRequestMetadata(metadata)) {
      return null;
    }

    // Check if already validated by guard
    const userId = getUserIdFromMetadata(metadata);
    if (typeof userId === "string" && userId) {
      return { userId };
    }

    // Use shared utility to extract session token
    const sessionToken = getSessionTokenFromMetadata(metadata);

    if (!sessionToken) {
      return null;
    }

    const validation = await this.validateSessionToken(sessionToken);
    return validation ? { userId: validation.userId } : null;
  }

  /**
   * Validate user_id and create error response if invalid
   */
  validateUserIdOrError(
    metadata: RequestMetadata | unknown
  ):
    | { success: true; userId: string }
    | { success: false; response: ReturnType<typeof createErrorResponse> } {
    const validation = this.validateUserIdFromMetadata(metadata);

    if (!validation) {
      return {
        success: false,
        response: createErrorResponse(
          createValidationError(
            "Invalid or missing user_id in metadata. Please authenticate."
          )
        ),
      };
    }

    return { success: true, userId: validation.userId };
  }

  /**
   * Validate session token and create error response if invalid
   */
  async validateSessionOrError(
    metadata: RequestMetadata | unknown
  ): Promise<
    | { success: true; userId: string }
    | { success: false; response: ReturnType<typeof createErrorResponse> }
  > {
    const validation = await this.validateSessionFromMetadata(metadata);

    if (!validation) {
      return {
        success: false,
        response: createErrorResponse(
          createValidationError(
            "Invalid or missing session token. Please authenticate."
          )
        ),
      };
    }

    return { success: true, userId: validation.userId };
  }

  /**
   * Ensure metadata has user_id and is properly normalized
   */
  ensureUserIdInMetadata(
    metadata: RequestMetadata | unknown
  ): RequestMetadata | null {
    const validation = this.validateUserIdFromMetadata(metadata);
    if (!validation) {
      return null;
    }

    // Use shared utility to normalize metadata
    // This handles both camelCase and snake_case, and ensures all fields are present
    const normalized = normalizeRequestMetadata(metadata, validation.userId);

    // Double check if it's valid according to our schema
    if (!isValidRequestMetadata(normalized)) {
      return null;
    }

    return {
      ...normalized,
      // Keep snake_case for backward compatibility if needed by some consumers
      user_id: normalized.userId,
      project_id: normalized.projectId,
      request_id: normalized.requestId,
    } as RequestMetadata;
  }
}
