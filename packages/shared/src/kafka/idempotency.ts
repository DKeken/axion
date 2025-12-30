/**
 * Kafka Idempotency & Deduplication
 * Ensures at-least-once semantics with deduplication
 */

import { createHash } from "crypto";

export type IdempotencyKey = {
  topic: string;
  partition: number;
  offset: string;
  correlationId?: string;
  causationId?: string;
}

/**
 * Generate deduplication key from Kafka message
 */
export function generateDeduplicationKey(
  topic: string,
  partition: number,
  offset: string,
  correlationId?: string,
  causationId?: string
): string {
  const key: IdempotencyKey = {
    topic,
    partition,
    offset,
    correlationId,
    causationId,
  };

  const hash = createHash("sha256").update(JSON.stringify(key)).digest("hex");

  return hash;
}

/**
 * Check if message was already processed
 *
 * Note: This requires a Redis client to be passed in.
 * In practice, you'd inject Redis from NestJS dependency injection.
 */
export async function isMessageProcessed(
  redis: {
    exists: (key: string) => Promise<number>;
    setex: (key: string, seconds: number, value: string) => Promise<string>;
  },
  deduplicationKey: string,
  ttlSeconds: number = 86400 // 24 hours
): Promise<boolean> {
  const key = `kafka:dedupe:${deduplicationKey}`;
  const exists = await redis.exists(key);

  if (exists) {
    return true; // Message already processed
  }

  // Mark as processed
  await redis.setex(key, ttlSeconds, "1");
  return false;
}
