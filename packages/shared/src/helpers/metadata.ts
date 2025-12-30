import type { RequestMetadata } from "@axion/contracts";

/**
 * Request metadata helper functions
 */

/**
 * Type guard for object with string keys
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Extract user_id from request metadata
 */
export function getUserIdFromMetadata(
  metadata: RequestMetadata | unknown
): string | undefined {
  if (isRecord(metadata)) {
    const userId = metadata.user_id ?? metadata.userId;
    return typeof userId === "string" ? userId : undefined;
  }
  return undefined;
}

/**
 * Extract project_id from request metadata
 */
export function getProjectIdFromMetadata(
  metadata: RequestMetadata | unknown
): string | undefined {
  if (isRecord(metadata)) {
    const projectId = metadata.project_id ?? metadata.projectId;
    return typeof projectId === "string" ? projectId : undefined;
  }
  return undefined;
}

/**
 * Extract request_id from request metadata
 */
export function getRequestIdFromMetadata(
  metadata: RequestMetadata | unknown
): string | undefined {
  if (isRecord(metadata)) {
    const requestId = metadata.request_id ?? metadata.requestId;
    return typeof requestId === "string" ? requestId : undefined;
  }
  return undefined;
}

/**
 * Create request metadata object
 */
export function createRequestMetadata(
  userId: string,
  projectId?: string,
  requestId?: string
): RequestMetadata {
  return {
    userId,
    projectId: projectId || "",
    requestId: requestId || "",
    timestamp: Date.now(),
  };
}

/**
 * Validate request metadata
 */
export function isValidRequestMetadata(
  metadata: unknown
): metadata is RequestMetadata {
  if (!isRecord(metadata)) {
    return false;
  }

  const userId = metadata.user_id ?? metadata.userId;
  const timestamp = metadata.timestamp;

  return (
    typeof userId === "string" &&
    userId.length > 0 &&
    typeof timestamp === "number"
  );
}

/**
 * Normalize request metadata from unknown input.
 * Ensures all required fields are present and correctly named (camelCase).
 * Handles both snake_case and camelCase inputs.
 */
export function normalizeRequestMetadata(
  metadata: unknown,
  fallbackUserId?: string
): RequestMetadata {
  if (!isRecord(metadata)) {
    return {
      userId: fallbackUserId ?? "",
      projectId: "",
      requestId: "",
      timestamp: Date.now(),
    };
  }

  const userId = (metadata.user_id ??
    metadata.userId ??
    fallbackUserId ??
    "") as string;
  const projectId = (metadata.project_id ?? metadata.projectId ?? "") as string;
  const requestId = (metadata.request_id ?? metadata.requestId ?? "") as string;

  let timestamp = Date.now();
  if (typeof metadata.timestamp === "number" && metadata.timestamp > 0) {
    timestamp = metadata.timestamp;
  } else if (typeof metadata.timestamp === "string") {
    const parsed = parseInt(metadata.timestamp, 10);
    if (!isNaN(parsed) && parsed > 0) {
      timestamp = parsed;
    }
  }

  return {
    userId: String(userId),
    projectId: String(projectId),
    requestId: String(requestId),
    timestamp,
  };
}

/**
 * Extract and normalize metadata from any payload object.
 * Useful for NestJS @Payload() where metadata is a property.
 * Always returns a valid RequestMetadata object even if input is invalid.
 */
export function extractMetadata(payload: unknown): RequestMetadata {
  if (isRecord(payload) && "metadata" in payload) {
    return normalizeRequestMetadata(payload.metadata);
  }
  return normalizeRequestMetadata(payload);
}

/**
 * Extract session token from request metadata
 * Supports multiple field names: sessionToken, session_token, authorization (Bearer token)
 */
export function getSessionTokenFromMetadata(
  metadata: RequestMetadata | unknown
): string | undefined {
  if (!isRecord(metadata)) {
    return undefined;
  }

  // Try sessionToken (camelCase)
  if (typeof metadata.sessionToken === "string" && metadata.sessionToken) {
    return metadata.sessionToken;
  }

  // Try session_token (snake_case)
  if (typeof metadata.session_token === "string" && metadata.session_token) {
    return metadata.session_token;
  }

  // Try authorization header (Bearer token)
  if (typeof metadata.authorization === "string" && metadata.authorization) {
    const bearerMatch = metadata.authorization.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch?.[1]) {
      return bearerMatch[1];
    }
  }

  return undefined;
}
