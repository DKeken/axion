/**
 * Kafka headers standardization
 * Provides utilities for managing correlationId, causationId, userId, projectId in Kafka messages
 */

import type { RequestMetadata } from "@axion/contracts";

/**
 * Standard Kafka header names
 */
export const KAFKA_HEADERS = {
  CORRELATION_ID: "x-correlation-id",
  CAUSATION_ID: "x-causation-id",
  USER_ID: "x-user-id",
  PROJECT_ID: "x-project-id",
  REQUEST_ID: "x-request-id",
  TIMESTAMP: "x-timestamp",
} as const;

/**
 * Extract correlationId from Kafka message headers
 */
export function getCorrelationIdFromHeaders(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const value =
    headers[KAFKA_HEADERS.CORRELATION_ID] ||
    headers["correlation-id"] ||
    headers["x-correlation-id"];

  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Extract causationId from Kafka message headers
 */
export function getCausationIdFromHeaders(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const value =
    headers[KAFKA_HEADERS.CAUSATION_ID] ||
    headers["causation-id"] ||
    headers["x-causation-id"];

  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Extract userId from Kafka message headers
 */
export function getUserIdFromHeaders(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const value =
    headers[KAFKA_HEADERS.USER_ID] ||
    headers["user-id"] ||
    headers["x-user-id"];

  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Extract projectId from Kafka message headers
 */
export function getProjectIdFromHeaders(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const value =
    headers[KAFKA_HEADERS.PROJECT_ID] ||
    headers["project-id"] ||
    headers["x-project-id"];

  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Create standard Kafka headers from RequestMetadata
 */
export function createKafkaHeaders(
  metadata: RequestMetadata,
  causationId?: string
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Correlation ID (from metadata.requestId or generate new)
  const correlationId =
    metadata.requestId || (metadata.correlationId as string | undefined) || "";
  if (correlationId && correlationId.length > 0) {
    headers[KAFKA_HEADERS.CORRELATION_ID] = correlationId;
  }

  // Causation ID (ID of the message that caused this one)
  if (causationId && causationId.length > 0) {
    headers[KAFKA_HEADERS.CAUSATION_ID] = causationId;
  } else if (correlationId && correlationId.length > 0) {
    // Use correlationId as causationId if not provided
    headers[KAFKA_HEADERS.CAUSATION_ID] = correlationId;
  }

  // User ID
  const userId =
    metadata.userId || (metadata.user_id as string | undefined) || "";
  if (userId && userId.length > 0) {
    headers[KAFKA_HEADERS.USER_ID] = userId;
  }

  // Project ID
  const projectId =
    metadata.projectId || (metadata.project_id as string | undefined) || "";
  if (projectId && projectId.length > 0) {
    headers[KAFKA_HEADERS.PROJECT_ID] = projectId;
  }

  // Request ID
  if (metadata.requestId) {
    headers[KAFKA_HEADERS.REQUEST_ID] = metadata.requestId;
  }

  // Timestamp
  headers[KAFKA_HEADERS.TIMESTAMP] = String(metadata.timestamp || Date.now());

  return headers;
}

/**
 * Extract RequestMetadata from Kafka message headers
 */
export function extractMetadataFromHeaders(
  headers: Record<string, string | string[] | undefined>
): RequestMetadata {
  const correlationId = getCorrelationIdFromHeaders(headers);
  const userId = getUserIdFromHeaders(headers);
  const projectId = getProjectIdFromHeaders(headers);
  const requestId = correlationId; // Use correlationId as requestId

  const timestampHeader =
    headers[KAFKA_HEADERS.TIMESTAMP] ||
    headers["timestamp"] ||
    headers["x-timestamp"];

  const timestamp = timestampHeader
    ? Array.isArray(timestampHeader)
      ? parseInt(timestampHeader[0], 10)
      : parseInt(timestampHeader, 10)
    : Date.now();

  // RequestMetadata requires userId, projectId, requestId, timestamp
  // Return minimal valid metadata
  return {
    userId: userId || "",
    projectId: projectId || "",
    requestId: requestId || "",
    timestamp,
  } as RequestMetadata;
}
