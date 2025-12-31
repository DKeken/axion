import type { RequestMetadata } from "../../generated/common/common_pb";

/**
 * Извлекает user_id из RequestMetadata
 */
export function getUserIdFromMetadata(
  metadata?: RequestMetadata
): string | null {
  return metadata?.userId || null;
}

/**
 * Извлекает request_id из RequestMetadata
 */
export function getRequestIdFromMetadata(
  metadata?: RequestMetadata
): string | null {
  return metadata?.requestId || null;
}

/**
 * Извлекает session_id из RequestMetadata
 */
export function getSessionIdFromMetadata(
  metadata?: RequestMetadata
): string | null {
  return metadata?.sessionId || null;
}

/**
 * Проверяет наличие обязательных полей в metadata
 */
export function validateMetadata(metadata?: RequestMetadata): boolean {
  if (!metadata) return false;
  if (!metadata.userId) return false;
  if (!metadata.requestId) return false;
  if (!metadata.timestamp) return false;
  return true;
}
