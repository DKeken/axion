import { createErrorResponse, createForbiddenError } from "@axion/contracts";

export type LimitCheckResult =
  | { success: true }
  | { success: false; response: ReturnType<typeof createErrorResponse> };

/**
 * Enforce a simple numeric limit.
 *
 * - If limit is undefined/null -> no limit.
 * - If current >= limit -> forbidden.
 */
export function enforceLimit(
  resourceName: string,
  current: number,
  limit: number | undefined | null
): LimitCheckResult {
  if (limit === undefined || limit === null) return { success: true };
  if (!Number.isFinite(limit) || limit <= 0) return { success: true };

  if (current >= limit) {
    return {
      success: false,
      response: createErrorResponse(
        createForbiddenError(
          `Limit exceeded for ${resourceName} (max ${limit})`
        )
      ),
    };
  }

  return { success: true };
}
