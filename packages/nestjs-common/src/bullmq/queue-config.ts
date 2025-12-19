/**
 * BullMQ Queue Configuration
 * Standardized configuration for queues with rate limiting and concurrency
 */

import type { WorkerOptions } from "bullmq";

/**
 * Rate Limiter Configuration
 */
export interface RateLimiterConfig {
  /**
   * Maximum number of jobs to process in the duration window
   */
  max: number;

  /**
   * Duration window in milliseconds
   */
  duration: number;
}

/**
 * Queue Configuration Options
 */
export interface QueueConfigOptions {
  /**
   * Rate limiter configuration
   * Limits the number of jobs processed per time window
   */
  limiter?: RateLimiterConfig;

  /**
   * Maximum number of concurrent jobs to process
   */
  concurrency?: number;

  /**
   * Lock duration in milliseconds
   * How long a job is locked before being considered stalled
   * @default 30000 (30 seconds)
   */
  lockDuration?: number;

  /**
   * Max stalled count
   * Maximum number of times a job can be stalled before being marked as failed
   * @default 1
   */
  maxStalledCount?: number;

  /**
   * Stalled interval in milliseconds
   * How often to check for stalled jobs
   * @default 30000 (30 seconds)
   */
  stalledInterval?: number;
}

/**
 * Create BullMQ Queue Options from configuration
 * Returns configuration object that can be passed to Queue constructor
 * Note: Most queue-level options (limiter) should be set in Queue constructor,
 * while job-level options (lockDuration) are set in defaultJobOptions or Worker
 */
export function createQueueOptions(config: QueueConfigOptions = {}): {
  limiter?: { max: number; duration: number };
} {
  const options: {
    limiter?: { max: number; duration: number };
  } = {};

  // Rate limiter (Queue-level option)
  if (config.limiter) {
    options.limiter = {
      max: config.limiter.max,
      duration: config.limiter.duration,
    };
  }

  // Note: lockDuration, maxStalledCount, stalledInterval are Worker options
  // and should be configured via createWorkerOptions

  return options;
}

/**
 * Worker Configuration Options
 */
export interface WorkerConfigOptions {
  /**
   * Maximum number of concurrent jobs to process
   * @default 1
   */
  concurrency?: number;

  /**
   * Lock duration in milliseconds
   * @default 30000 (30 seconds)
   */
  lockDuration?: number;

  /**
   * Max stalled count
   * @default 1
   */
  maxStalledCount?: number;

  /**
   * Stalled interval in milliseconds
   * @default 30000 (30 seconds)
   */
  stalledInterval?: number;
}

/**
 * Create BullMQ Worker Options from configuration
 */
export function createWorkerOptions(
  config: WorkerConfigOptions = {}
): Partial<WorkerOptions> {
  const options: Partial<WorkerOptions> = {
    concurrency: config.concurrency ?? 1,
    lockDuration: config.lockDuration ?? 30000, // 30 seconds
  };

  // Max stalled count
  if (config.maxStalledCount !== undefined) {
    options.maxStalledCount = config.maxStalledCount;
  }

  // Stalled interval
  if (config.stalledInterval !== undefined) {
    options.stalledInterval = config.stalledInterval;
  }

  return options;
}

/**
 * Parse rate limiter from environment variable
 * Format: "max:duration" where duration is in seconds
 * Example: "10:60" = 10 jobs per 60 seconds
 */
export function parseRateLimiterFromEnv(
  envValue?: string
): RateLimiterConfig | undefined {
  if (!envValue) {
    return undefined;
  }

  const parts = envValue.split(":");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid rate limiter format: ${envValue}. Expected format: "max:duration" (e.g., "10:60" for 10 jobs per 60 seconds)`
    );
  }

  const max = parseInt(parts[0], 10);
  const durationSeconds = parseInt(parts[1], 10);

  if (
    isNaN(max) ||
    isNaN(durationSeconds) ||
    max <= 0 ||
    durationSeconds <= 0
  ) {
    throw new Error(
      `Invalid rate limiter values: ${envValue}. Max and duration must be positive integers.`
    );
  }

  return {
    max,
    duration: durationSeconds * 1000, // Convert seconds to milliseconds
  };
}

/**
 * Standard Queue Configurations
 */
export const QUEUE_CONFIGS = {
  /**
   * Default configuration for most queues
   */
  default: (): QueueConfigOptions => ({
    lockDuration: 30000, // 30 seconds
    maxStalledCount: 1,
    stalledInterval: 30000, // 30 seconds
  }),

  /**
   * Configuration for high-volume queues
   */
  highVolume: (): QueueConfigOptions => ({
    limiter: {
      max: 100,
      duration: 60000, // 100 jobs per minute
    },
    lockDuration: 60000, // 60 seconds (longer for heavy jobs)
    maxStalledCount: 3,
    stalledInterval: 30000,
  }),

  /**
   * Configuration for low-priority queues
   */
  lowPriority: (): QueueConfigOptions => ({
    limiter: {
      max: 5,
      duration: 60000, // 5 jobs per minute
    },
    lockDuration: 120000, // 2 minutes
    maxStalledCount: 2,
    stalledInterval: 60000, // Check every minute
  }),

  /**
   * Configuration for critical queues (deployments)
   */
  critical: (): QueueConfigOptions => ({
    lockDuration: 300000, // 5 minutes (longer for deployment jobs)
    maxStalledCount: 5, // More retries before failing
    stalledInterval: 30000,
  }),
} as const;
