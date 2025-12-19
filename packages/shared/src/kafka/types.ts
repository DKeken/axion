/**
 * Kafka Message Types
 * Type definitions for Kafka message structure
 */

/**
 * Kafka message structure compatible with KafkaJS and NestJS KafkaContext
 */
export interface KafkaMessagePayload {
  topic?: string;
  partition?: number;
  offset?: string;
  key?: string | Buffer | null;
  headers?: Record<string, string | Buffer | (string | Buffer)[] | undefined>;
  value: unknown;
}
