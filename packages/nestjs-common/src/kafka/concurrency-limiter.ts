/**
 * Kafka Concurrency Limiter
 * Manages concurrent execution limits per handler
 */

import { Injectable, Logger } from "@nestjs/common";

export interface ConcurrencyLimitConfig {
  maxConcurrentHandlers: number;
}

/**
 * Kafka Concurrency Limiter
 * Tracks and limits concurrent message processing per handler
 */
@Injectable()
export class KafkaConcurrencyLimiter {
  private readonly logger = new Logger(KafkaConcurrencyLimiter.name);
  private readonly activeHandlers = new Map<
    string,
    Set<symbol>
  >();
  private readonly configs = new Map<string, ConcurrencyLimitConfig>();

  /**
   * Register configuration for a handler
   */
  registerConfig(
    handlerName: string,
    config: ConcurrencyLimitConfig
  ): void {
    this.configs.set(handlerName, config);
  }

  /**
   * Acquire a slot for handler execution
   * Returns a release function that must be called when done
   * @throws Error if concurrency limit is exceeded
   */
  async acquire(
    handlerName: string,
    config?: ConcurrencyLimitConfig
  ): Promise<() => void> {
    const effectiveConfig =
      config || this.configs.get(handlerName) || { maxConcurrentHandlers: 10 };

    const active = this.activeHandlers.get(handlerName) || new Set<symbol>();
    const token = Symbol(`${handlerName}-${Date.now()}-${Math.random()}`);

    if (active.size >= effectiveConfig.maxConcurrentHandlers) {
      this.logger.warn(
        `Concurrency limit exceeded for handler ${handlerName} (active: ${active.size}, limit: ${effectiveConfig.maxConcurrentHandlers})`
      );
      throw new Error(
        `Concurrency limit exceeded for handler ${handlerName}: ${active.size}/${effectiveConfig.maxConcurrentHandlers}`
      );
    }

    active.add(token);
    this.activeHandlers.set(handlerName, active);

    this.logger.debug(
      `Acquired slot for handler ${handlerName} (active: ${active.size}/${effectiveConfig.maxConcurrentHandlers})`
    );

    // Return release function
    return () => {
      const currentActive = this.activeHandlers.get(handlerName);
      if (currentActive) {
        currentActive.delete(token);
        if (currentActive.size === 0) {
          this.activeHandlers.delete(handlerName);
        }
      }
    };
  }

  /**
   * Get current active count for a handler
   */
  getActiveCount(handlerName: string): number {
    return this.activeHandlers.get(handlerName)?.size || 0;
  }

  /**
   * Get all active handlers and their counts
   */
  getAllActiveCounts(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [handlerName, activeSet] of this.activeHandlers.entries()) {
      result[handlerName] = activeSet.size;
    }
    return result;
  }
}