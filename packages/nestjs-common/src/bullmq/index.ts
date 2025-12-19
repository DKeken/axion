/**
 * BullMQ utilities for NestJS microservices
 */

// Types
export type {
  QueueOptions,
  BullMQConnectionConfig,
  BullMQModuleOptions,
  BullMQModuleAsyncOptions,
} from "./types";

// Constants
export { DEFAULT_QUEUE_OPTIONS, QUEUE_NAMES } from "./constants";

// Helpers
export {
  parseRedisUrl,
  createBullMQConnectionConfig,
  toBullMQJobOptions,
  addStandardJob,
} from "./helpers";

// Job helpers (with correlationId support)
export {
  enrichJobPayloadWithMetadata,
  getCorrelationIdFromJob,
  BACKOFF_STRATEGIES,
  JOB_OPTIONS_PRESETS,
  addStandardJob as addStandardJobWithMetadata,
  type StandardJobPayload,
} from "./job-helpers";

// Queue configuration
export {
  createQueueOptions,
  createWorkerOptions,
  parseRateLimiterFromEnv,
  QUEUE_CONFIGS,
  type QueueConfigOptions,
  type WorkerConfigOptions,
  type RateLimiterConfig,
} from "./queue-config";

// Metrics
export {
  getQueueMetrics,
  getJobMetrics,
  getJobsMetrics,
  getQueueMetricsSummary,
  type QueueMetrics,
  type JobMetrics,
  type QueueMetricsSummary,
} from "./metrics";

// Metrics Controller (optional, for HTTP endpoints)
export {
  BullMQMetricsController,
  createMetricsController,
} from "./metrics-controller";

// Module
export { BullMQModule } from "./bullmq.module";
