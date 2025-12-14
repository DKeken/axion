/**
 * Metadata helper for Graph Service
 * Centralized metadata validation and userId extraction
 */

import type { RequestMetadata } from "@axion/contracts";
import {
  createErrorResponse,
  createValidationError,
} from "@axion/contracts";
import { getUserIdFromMetadata } from "@axion/shared";

/**
 * Result of metadata validation
 */
export type MetadataValidationResult =
  | { success: true; userId: string }
  | { success: false; response: ReturnType<typeof createErrorResponse> };

/**
 * Validate metadata and extract userId
 * Use this when there's no resourceId to check access
 * (e.g., for create/list operations)
 */
export function validateMetadata(
  metadata: RequestMetadata | unknown
): MetadataValidationResult {
  const userId = getUserIdFromMetadata(metadata);
  if (!userId) {
    return {
      success: false,
      response: createErrorResponse(
        createValidationError("user_id is required in metadata")
      ),
    };
  }

  return { success: true, userId };
}

