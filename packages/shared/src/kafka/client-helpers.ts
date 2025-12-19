/**
 * Kafka client helpers for sending messages with standard headers
 */

import type { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import type { RequestMetadata } from "@axion/contracts";
import { createKafkaHeaders, getCorrelationIdFromHeaders } from "./headers";

/**
 * Send Kafka message with standard headers
 * Automatically adds correlationId, causationId, userId, projectId to message
 *
 * @example
 * ```typescript
 * const response = await sendKafkaMessage(
 *   this.graphClient,
 *   GRAPH_SERVICE_PATTERNS.CREATE_PROJECT,
 *   { name: "My Project" },
 *   metadata
 * );
 * ```
 */
export async function sendKafkaMessage<TRequest, TResponse>(
  client: ClientProxy,
  pattern: string,
  data: TRequest & { metadata?: RequestMetadata },
  existingHeaders?: Record<string, string>
): Promise<TResponse> {
  // Extract metadata from data or use existing
  const metadata = data.metadata;
  if (!metadata) {
    throw new Error("RequestMetadata is required for Kafka messages");
  }

  // Get correlationId from existing headers (for causationId)
  const correlationId = existingHeaders
    ? getCorrelationIdFromHeaders(existingHeaders)
    : undefined;

  // Create standard headers
  const headers = createKafkaHeaders(metadata, correlationId);

  // Send message with headers
  // Note: NestJS ClientProxy/ClientKafka includes headers in metadata
  // We include headers in metadata for serialization
  const payload = {
    ...data,
    metadata: {
      ...metadata,
      // Include headers in metadata for serialization
      headers,
    },
  };

  const response = await firstValueFrom(client.send(pattern, payload));

  return response as TResponse;
}

/**
 * Emit Kafka event with standard headers
 * Similar to sendKafkaMessage but for fire-and-forget events
 */
export async function emitKafkaEvent<TEvent>(
  client: ClientProxy,
  pattern: string,
  data: TEvent & { metadata?: RequestMetadata },
  existingHeaders?: Record<string, string>
): Promise<void> {
  const metadata = data.metadata;
  if (!metadata) {
    throw new Error("RequestMetadata is required for Kafka events");
  }

  const correlationId = existingHeaders
    ? getCorrelationIdFromHeaders(existingHeaders)
    : undefined;

  const headers = createKafkaHeaders(metadata, correlationId);

  client.emit(pattern, {
    ...data,
    metadata: {
      ...metadata,
      headers,
    },
  });
}
