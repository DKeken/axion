import { type RequestMetadata, RequestMetadataSchema } from "@axion/contracts";
import { create } from "@bufbuild/protobuf";
import { timestampNow } from "@bufbuild/protobuf/wkt";

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
 * Extract userId from request metadata
 */
export function getUserIdFromMetadata(
  metadata: RequestMetadata | unknown
): string | undefined {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }
  const meta = metadata as RequestMetadata;
  return meta.userId || undefined;
}

/**
 * Extract requestId from request metadata
 */
export function getRequestIdFromMetadata(
  metadata: RequestMetadata | unknown
): string | undefined {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }
  const meta = metadata as RequestMetadata;
  return meta.requestId || undefined;
}

/**
 * Create request metadata object
 */
export function createRequestMetadata(
  userId: string,
  requestId?: string,
  sessionId?: string
): RequestMetadata {
  return create(RequestMetadataSchema, {
    userId,
    requestId: requestId || "",
    sessionId: sessionId || "",
    timestamp: timestampNow(),
  });
}

/**
 * Validate request metadata
 */
export function isValidRequestMetadata(
  metadata: unknown
): metadata is RequestMetadata {
  if (!metadata || typeof metadata !== "object") {
    return false;
  }

  const meta = metadata as RequestMetadata;
  return typeof meta.userId === "string" && meta.userId.length > 0;
}

/**
 * Normalize request metadata from unknown input.
 * Ensures all required fields are present and correctly named (camelCase).
 */
export function normalizeRequestMetadata(
  metadata: unknown,
  fallbackUserId?: string
): RequestMetadata {
  if (!isRecord(metadata)) {
    return create(RequestMetadataSchema, {
      userId: fallbackUserId ?? "",
      requestId: "",
      sessionId: "",
      timestamp: timestampNow(),
    });
  }

  const userId = String(metadata.userId ?? fallbackUserId ?? "");
  const requestId = String(metadata.requestId ?? "");
  const sessionId = String(metadata.sessionId ?? "");

  return create(RequestMetadataSchema, {
    userId,
    requestId,
    sessionId,
    timestamp: timestampNow(),
  });
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
