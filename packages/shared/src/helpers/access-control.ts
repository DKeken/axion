/**
 * Access Control - Resource ownership verification
 * Uses CASL abilities for permission checking
 */

import {
  createErrorResponse,
  createValidationError,
  createNotFoundError,
  createForbiddenError,
  type RequestMetadata,
} from "@axion/contracts";
import { getUserIdFromMetadata } from "./metadata";
import { canAccessProject } from "./casl-abilities";

/**
 * Generic access control helper for resources owned by users
 * This pattern can be reused across microservices for checking user access to resources
 */
export interface ResourceAccessCheck<TResource> {
  findById(id: string): Promise<TResource | null>;
  getOwnerId(resource: TResource): string;
  resourceName: string;
}

/**
 * Result of access verification
 */
export type AccessVerificationResult =
  | { success: true; userId: string }
  | { success: false; response: ReturnType<typeof createErrorResponse> };

/**
 * Verify user has access to a resource (ownership-based)
 *
 * @param check - Access check configuration
 * @param resourceId - ID of the resource
 * @param metadata - Request metadata containing user information
 * @returns Access verification result with userId or error response
 */
export async function verifyResourceAccess<TResource>(
  check: ResourceAccessCheck<TResource>,
  resourceId: string,
  metadata: RequestMetadata | unknown
): Promise<AccessVerificationResult> {
  const userId = getUserIdFromMetadata(metadata);
  if (!userId) {
    return {
      success: false,
      response: createErrorResponse(
        createValidationError("user_id is required in metadata")
      ),
    };
  }

  const resource = await check.findById(resourceId);
  if (!resource) {
    return {
      success: false,
      response: createErrorResponse(
        createNotFoundError(check.resourceName, resourceId)
      ),
    };
  }

  const ownerId = check.getOwnerId(resource);

  // Use CASL for ownership verification
  const hasAccess = canAccessProject(userId, { userId: ownerId });

  if (!hasAccess) {
    return {
      success: false,
      response: createErrorResponse(
        createForbiddenError(`Access denied to this ${check.resourceName}`)
      ),
    };
  }

  return { success: true, userId };
}
