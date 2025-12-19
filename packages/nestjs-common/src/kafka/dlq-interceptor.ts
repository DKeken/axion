/**
 * Kafka DLQ Interceptor
 * Automatically sends failed messages to Dead Letter Queue
 */

import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { Injectable, NestInterceptor, Logger } from "@nestjs/common";
import type { Observable } from "rxjs";
import { catchError, throwError } from "rxjs";
import type { KafkaContext } from "@nestjs/microservices";
import type { ClientKafka } from "@nestjs/microservices";

import {
  createDLQEventEnvelope,
  getDLQTopicName,
  shouldSendToDLQ,
  isDLQReplay,
  getCorrelationIdFromHeaders,
  convertKafkaHeaders,
  type KafkaMessagePayload,
} from "@axion/shared";

/**
 * DLQ Interceptor Options
 */
export interface DLQInterceptorOptions {
  /**
   * Maximum retry attempts before sending to DLQ
   * @default 3
   */
  maxRetries?: number;

  /**
   * Service name for DLQ topic naming
   */
  serviceName: string;

  /**
   * Use common DLQ topic instead of service-specific
   * @default false
   */
  useCommonDLQ?: boolean;

  /**
   * Kafka client for sending DLQ messages
   * If not provided, DLQ messages will only be logged
   */
  dlqClient?: ClientKafka;

  /**
   * Whether to enable DLQ (default: true)
   * @default true
   */
  enabled?: boolean;
}

/**
 * Kafka DLQ Interceptor
 * Catches errors in MessagePattern handlers and sends failed messages to DLQ
 */
@Injectable()
export class KafkaDLQInterceptor implements NestInterceptor {
  private readonly logger = new Logger(KafkaDLQInterceptor.name);
  private readonly options: Required<Omit<DLQInterceptorOptions, "dlqClient">> &
    Pick<DLQInterceptorOptions, "dlqClient">;

  constructor(options: DLQInterceptorOptions) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      serviceName: options.serviceName,
      useCommonDLQ: options.useCommonDLQ ?? false,
      enabled: options.enabled ?? true,
      dlqClient: options.dlqClient,
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Only intercept Kafka message handlers
    if (context.getType() !== "rpc") {
      return next.handle();
    }

    const kafkaContext = context.switchToRpc().getContext<KafkaContext>();
    const message = kafkaContext.getMessage();
    const pattern = context.switchToRpc().getData()?.pattern || "";

    // Convert Kafka headers from Buffer to string format
    const headers = convertKafkaHeaders(message.headers || {});

    // Skip DLQ for replay messages to prevent infinite loops
    if (isDLQReplay(headers)) {
      const correlationId = getCorrelationIdFromHeaders(headers);
      this.logger.warn(
        `Skipping DLQ for replay message (pattern: ${pattern}, correlationId: ${correlationId})`
      );
      return next.handle();
    }

    // Get attempt count from headers
    const attemptHeader =
      headers["x-attempt"] || headers["attempt"] || headers["X-Attempt"];
    const attempt = attemptHeader
      ? parseInt(
          Array.isArray(attemptHeader) ? attemptHeader[0] : attemptHeader,
          10
        )
      : 1;

    if (!this.options.enabled) {
      return next.handle();
    }

    return next.handle().pipe(
      catchError((error) => {
        const correlationId = getCorrelationIdFromHeaders(headers);

        this.logger.error(
          `[${correlationId}] Message processing failed (attempt ${attempt}/${this.options.maxRetries}, pattern: ${pattern})`,
          error instanceof Error ? error.stack : undefined
        );

        // Check if should send to DLQ
        if (shouldSendToDLQ(attempt, this.options.maxRetries)) {
          this.sendToDLQ(
            kafkaContext,
            message,
            error,
            attempt,
            pattern,
            correlationId
          ).catch((dlqError) => {
            this.logger.error(
              `[${correlationId}] Failed to send message to DLQ`,
              dlqError instanceof Error ? dlqError.stack : undefined
            );
          });
        }

        return throwError(() => error);
      })
    );
  }

  private async sendToDLQ(
    kafkaContext: KafkaContext,
    message: KafkaMessagePayload,
    error: unknown,
    attempt: number,
    pattern: string,
    correlationId?: string
  ): Promise<void> {
    const dlqTopic = getDLQTopicName(
      this.options.serviceName,
      this.options.useCommonDLQ
    );

    // Get topic from KafkaContext
    const topic = kafkaContext.getTopic() || message.topic || "unknown";
    const key = message.key
      ? Buffer.isBuffer(message.key)
        ? message.key.toString("utf-8")
        : message.key
      : undefined;

    // Convert headers
    const convertedHeaders = convertKafkaHeaders(message.headers || {});

    const envelope = createDLQEventEnvelope(
      topic,
      key,
      convertedHeaders,
      message.value,
      error,
      attempt,
      this.options.serviceName,
      pattern
    );

    this.logger.warn(
      `[${correlationId}] Sending message to DLQ: ${dlqTopic} (original topic: ${topic}, pattern: ${pattern})`
    );

    // If DLQ client is provided, send message to DLQ topic
    if (this.options.dlqClient) {
      try {
        this.options.dlqClient.emit(dlqTopic, envelope);
        this.logger.log(`[${correlationId}] Message sent to DLQ: ${dlqTopic}`);
      } catch (emitError) {
        this.logger.error(
          `[${correlationId}] Failed to emit message to DLQ`,
          emitError instanceof Error ? emitError.stack : undefined
        );
        throw emitError;
      }
    } else {
      // If no DLQ client, just log the envelope
      this.logger.warn(
        `[${correlationId}] DLQ client not configured, logging envelope:`,
        JSON.stringify(envelope, null, 2)
      );
    }
  }
}
