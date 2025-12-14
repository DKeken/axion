import {
  type RequestMetadata,
  createErrorResponse,
  createValidationError,
} from "@axion/contracts";
import {
  getProjectIdFromMetadata,
  getRequestIdFromMetadata,
  getSessionTokenFromMetadata,
  getUserIdFromMetadata,
  isValidRequestMetadata,
} from "@axion/shared";
import { getUserIdFromSession } from "@axion/better-auth";
import type { UserSession } from "@thallesp/nestjs-better-auth";
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { betterAuth } from "better-auth";

/**
 * Helper for authentication validation in microservices
 * Uses Better Auth for session validation
 */
@Injectable()
export class AuthHelper {
  private readonly logger = new Logger(AuthHelper.name);

  constructor(
    @Inject("BETTER_AUTH")
    private readonly auth: ReturnType<typeof betterAuth>
  ) {}

  /**
   * Validate session token and return session
   * Better Auth's getSession validates the session - if it returns non-null, session is valid
   */
  async validateSessionToken(
    sessionToken: string | undefined | null
  ): Promise<{ session: UserSession; userId: string } | null> {
    if (typeof sessionToken !== "string" || !sessionToken) {
      return null;
    }

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
      this.logger.warn("Error validating session token", error);
      return null;
    }
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
   * Ensure metadata has user_id
   */
  ensureUserIdInMetadata(
    metadata: RequestMetadata | unknown
  ): RequestMetadata | null {
    const validation = this.validateUserIdFromMetadata(metadata);
    if (!validation) {
      return null;
    }

    // Use shared utility to validate metadata
    if (!isValidRequestMetadata(metadata)) {
      return null;
    }

    // Use shared utilities to extract values
    const projectId = getProjectIdFromMetadata(metadata) || "";
    const requestId = getRequestIdFromMetadata(metadata) || "";
    const timestamp =
      (typeof metadata.timestamp === "number" && metadata.timestamp) ||
      Date.now();

    return {
      userId: validation.userId,
      user_id: validation.userId,
      projectId,
      project_id: projectId,
      requestId,
      request_id: requestId,
      timestamp,
    } satisfies RequestMetadata;
  }
}
