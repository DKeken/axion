/**
 * Kafka headers standardization
 * Provides utilities for managing correlationId, causationId, userId, projectId in Kafka messages
 */

import { type RequestMetadata, RequestMetadataSchema } from "@axion/contracts";
import { create } from "@bufbuild/protobuf";
import { timestampFromMs } from "@bufbuild/protobuf/wkt";

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

  // Correlation ID (from metadata.requestId)
  const correlationId = metadata.requestId || "";
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
  if (metadata.userId && metadata.userId.length > 0) {
    headers[KAFKA_HEADERS.USER_ID] = metadata.userId;
  }

  // Request ID
  if (metadata.requestId) {
    headers[KAFKA_HEADERS.REQUEST_ID] = metadata.requestId;
  }

  // Timestamp (convert Protobuf Timestamp to milliseconds)
  const timestamp = metadata.timestamp
    ? Number(metadata.timestamp.seconds) * 1000 +
      Math.floor(Number(metadata.timestamp.nanos) / 1000000)
    : Date.now();
  headers[KAFKA_HEADERS.TIMESTAMP] = String(timestamp);

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
  const requestId = correlationId; // Use correlationId as requestId

  const timestampHeader =
    headers[KAFKA_HEADERS.TIMESTAMP] ||
    headers["timestamp"] ||
    headers["x-timestamp"];

  const timestampMs = timestampHeader
    ? Array.isArray(timestampHeader)
      ? parseInt(timestampHeader[0], 10)
      : parseInt(timestampHeader, 10)
    : Date.now();

  return create(RequestMetadataSchema, {
    userId: userId || "",
    requestId: requestId || "",
    sessionId: "",
    timestamp: timestampFromMs(timestampMs),
  });
}
