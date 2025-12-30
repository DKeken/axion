/**
 * Kafka Backpressure Interceptor
 * Limits concurrent message processing per handler to prevent overload
 */

import type { CallHandler, ExecutionContext } from "@nestjs/common";
import {
  Injectable,
  NestInterceptor,
  Logger,
  Inject,
  Optional,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";

import { KafkaConcurrencyLimiter } from "./concurrency-limiter";

export type BackpressureInterceptorOptions = {
  /**
   * Maximum concurrent handlers per message handler
   * @default 10
   */
  maxConcurrentHandlers?: number;

  /**
   * Concurrency limiter instance
   * If not provided, a new instance will be created
   */
  concurrencyLimiter?: KafkaConcurrencyLimiter;

  /**
   * Whether to enable backpressure (default: true)
   * @default true
   */
  enabled?: boolean;
}

/**
 * Kafka Backpressure Interceptor
 * Limits concurrent execution of message handlers to prevent system overload
 */
@Injectable()
export class KafkaBackpressureInterceptor implements NestInterceptor {
  private readonly logger = new Logger(KafkaBackpressureInterceptor.name);
  private readonly concurrencyLimiter: KafkaConcurrencyLimiter;
  private readonly enabled: boolean;
  private readonly defaultMaxConcurrent: number;

  constructor(
    @Optional()
    @Inject(KafkaConcurrencyLimiter)
    concurrencyLimiter?: KafkaConcurrencyLimiter,
    options: BackpressureInterceptorOptions = {}
  ) {
    this.concurrencyLimiter =
      concurrencyLimiter || new KafkaConcurrencyLimiter();
    this.enabled = options.enabled ?? true;
    this.defaultMaxConcurrent =
      options.maxConcurrentHandlers ||
      parseInt(process.env.KAFKA_MAX_CONCURRENT_HANDLERS || "10", 10);
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

    const handler = context.getHandler();
    const handlerName = handler.name;

    try {
      const release = await this.concurrencyLimiter.acquire(handlerName, {
        maxConcurrentHandlers: this.defaultMaxConcurrent,
      });

      return new Observable((observer) => {
        let released = false;
        const subscription = next.handle().subscribe({
          next: (value) => {
            if (!released) {
              release();
              released = true;
            }
            observer.next(value);
          },
          error: (error) => {
            if (!released) {
              release();
              released = true;
            }
            observer.error(error);
          },
          complete: () => {
            if (!released) {
              release();
              released = true;
            }
            observer.complete();
          },
        });

        // Cleanup on unsubscribe
        return () => {
          if (!released) {
            release();
            released = true;
          }
          subscription.unsubscribe();
        };
      });
    } catch (_error) {
      const activeCount = this.concurrencyLimiter.getActiveCount(handlerName);
      this.logger.warn(
        `Concurrency limit exceeded for handler ${handlerName} (active: ${activeCount}, limit: ${this.defaultMaxConcurrent})`
      );
      return throwError(
        () =>
          new Error(
            `Concurrency limit exceeded for handler ${handlerName}: ${activeCount}/${this.defaultMaxConcurrent}`
          )
      );
    }
  }
}
