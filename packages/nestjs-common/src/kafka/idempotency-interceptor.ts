/**
 * Kafka Idempotency Interceptor
 * Ensures message processing idempotency by deduplicating messages
 */

import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from "@nestjs/common";
import { Injectable, Logger, Optional } from "@nestjs/common";
import type { Observable } from "rxjs";
import { of } from "rxjs";
import {
  generateDeduplicationKey,
  isMessageProcessed,
  convertKafkaHeaders,
  getCorrelationIdFromHeaders,
} from "@axion/shared";
import type { KafkaContext } from "@nestjs/microservices";

/**
 * Redis client interface for idempotency
 * Compatible with ioredis, node-redis, and other Redis clients
 */
export interface RedisClient {
  exists: (key: string) => Promise<number>;
  setex: (key: string, seconds: number, value: string) => Promise<string>;
}

export interface IdempotencyInterceptorOptions {
  redis?: RedisClient;
  ttlSeconds?: number;
  enabled?: boolean;
}

@Injectable()
export class KafkaIdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(KafkaIdempotencyInterceptor.name);
  private readonly redis?: RedisClient;
  private readonly ttlSeconds: number;
  private readonly enabled: boolean;

  constructor(@Optional() options: IdempotencyInterceptorOptions = {}) {
    this.redis = options.redis;
    this.ttlSeconds = options.ttlSeconds || 86400; // 24 hours default
    this.enabled = options.enabled ?? true;
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    // Only intercept Kafka message handlers
    if (context.getType() !== "rpc") {
      return next.handle();
    }

    if (!this.enabled) {
      return next.handle();
    }

    // Skip if Redis is not available
    if (!this.redis) {
      this.logger.warn(
        "Redis not available - idempotency check disabled. Messages may be processed multiple times."
      );
      return next.handle();
    }

    const kafkaContext = context.switchToRpc().getContext<KafkaContext>();
    const message = kafkaContext.getMessage();

    const topic = kafkaContext.getTopic();
    const partition = kafkaContext.getPartition();
    const offset = message.offset || "";

    const headers = convertKafkaHeaders(message.headers || {});
    const correlationId = getCorrelationIdFromHeaders(headers);

    const deduplicationKey = generateDeduplicationKey(
      topic,
      partition,
      offset,
      correlationId,
      headers["x-causation-id"] as string | undefined
    );

    try {
      const alreadyProcessed = await isMessageProcessed(
        this.redis,
        deduplicationKey,
        this.ttlSeconds
      );

      if (alreadyProcessed) {
        this.logger.debug(
          `Message already processed (topic: ${topic}, partition: ${partition}, offset: ${offset}, correlationId: ${correlationId})`
        );

        // Return idempotent response
        return of({
          idempotent: true,
          message: "Already processed",
          correlationId,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to check idempotency (correlationId: ${correlationId})`,
        error instanceof Error ? error.stack : undefined
      );

      // Continue processing if idempotency check fails
      // This ensures system continues to work even if Redis is temporarily unavailable
      return next.handle();
    }

    // Message not processed yet - continue with normal processing
    return next.handle();
  }
}
