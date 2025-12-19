/**
 * Kafka Retry Interceptor
 * Implements immediate retry with exponential backoff for transient errors
 */

import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { Observable } from "rxjs";
import { catchError, delay, retry } from "rxjs/operators";
import { throwError } from "rxjs";
import {
  shouldRetry,
  getRetryDelay,
  DEFAULT_RETRY_POLICY,
  type RetryPolicy,
  convertKafkaHeaders,
} from "@axion/shared";
import type { KafkaContext } from "@nestjs/microservices";

export interface RetryInterceptorOptions {
  policy?: RetryPolicy;
  enabled?: boolean;
}

@Injectable()
export class KafkaRetryInterceptor implements NestInterceptor {
  private readonly policy: RetryPolicy;
  private readonly enabled: boolean;

  constructor(options: RetryInterceptorOptions = {}) {
    this.policy = options.policy || DEFAULT_RETRY_POLICY;
    this.enabled = options.enabled ?? true;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Only intercept Kafka message handlers
    if (context.getType() !== "rpc") {
      return next.handle();
    }

    if (!this.enabled) {
      return next.handle();
    }

    const kafkaContext = context.switchToRpc().getContext<KafkaContext>();
    const message = kafkaContext.getMessage();
    const headers = convertKafkaHeaders(message.headers || {});

    // Get attempt count from headers
    const attemptHeader =
      headers["x-retry-attempt"] || headers["attempt"] || headers["X-Attempt"];
    const attempt = attemptHeader
      ? parseInt(
          Array.isArray(attemptHeader) ? attemptHeader[0] : attemptHeader,
          10
        )
      : 1;

    return next.handle().pipe(
      catchError((error) => {
        if (shouldRetry(error, attempt, this.policy)) {
          const delayMs = getRetryDelay(attempt, this.policy);

          // Retry once with delay
          return throwError(() => error).pipe(delay(delayMs), retry(1));
        }

        // Non-retryable error - propagate to DLQ interceptor
        return throwError(() => error);
      })
    );
  }
}
