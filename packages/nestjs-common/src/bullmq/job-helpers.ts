/**
 * BullMQ job helpers with correlationId support
 */

import type { Job, JobsOptions, Queue } from "bullmq";
import type { RequestMetadata } from "@axion/contracts";
import { getRequestIdFromMetadata } from "@axion/shared";

/**
 * Standard job payload with correlationId
 */
export interface StandardJobPayload {
  correlationId?: string;
  requestId?: string;
  userId?: string;
  projectId?: string;
  timestamp?: number;
  [key: string]: unknown;
}

/**
 * Add correlationId to job payload from RequestMetadata
 */
export function enrichJobPayloadWithMetadata<T extends Record<string, unknown>>(
  payload: T,
  metadata?: RequestMetadata | unknown
): T & StandardJobPayload {
  if (!metadata) {
    return payload as T & StandardJobPayload;
  }

  const requestId = getRequestIdFromMetadata(metadata);
  const userId =
    typeof metadata === "object" &&
    metadata !== null &&
    ("userId" in metadata || "user_id" in metadata)
      ? (metadata as { userId?: string; user_id?: string }).userId ||
        (metadata as { userId?: string; user_id?: string }).user_id
      : undefined;

  const projectId =
    typeof metadata === "object" &&
    metadata !== null &&
    ("projectId" in metadata || "project_id" in metadata)
      ? (metadata as { projectId?: string; project_id?: string }).projectId ||
        (metadata as { projectId?: string; project_id?: string }).project_id
      : undefined;

  const timestamp =
    typeof metadata === "object" && metadata !== null && "timestamp" in metadata
      ? (metadata as { timestamp?: number }).timestamp
      : Date.now();

  return {
    ...payload,
    correlationId: requestId,
    requestId,
    userId,
    projectId,
    timestamp,
  } as T & StandardJobPayload;
}

/**
 * Extract correlationId from job payload
 */
export function getCorrelationIdFromJob(
  job: Job<StandardJobPayload>
): string | undefined {
  return job.data.correlationId || job.data.requestId;
}

/**
 * Standard backoff strategies
 */
export const BACKOFF_STRATEGIES = {
  /**
   * Exponential backoff: 1s, 2s, 4s, 8s, 16s, ...
   */
  exponential: (delay: number = 1000) => ({
    type: "exponential" as const,
    delay,
  }),

  /**
   * Fixed backoff: same delay for each retry
   */
  fixed: (delay: number = 5000) => ({
    type: "fixed" as const,
    delay,
  }),

  /**
   * Fast retry: immediate retry, then exponential
   */
  fast: () => ({
    type: "exponential" as const,
    delay: 500,
  }),

  /**
   * Slow retry: longer delays for expensive operations
   */
  slow: () => ({
    type: "exponential" as const,
    delay: 5000,
  }),
} as const;

/**
 * Standard job options presets
 */
export const JOB_OPTIONS_PRESETS = {
  /**
   * Quick job: 3 attempts, fast backoff, remove on complete
   */
  quick: (): JobsOptions => ({
    attempts: 3,
    backoff: BACKOFF_STRATEGIES.fast(),
    removeOnComplete: true,
    removeOnFail: false,
  }),

  /**
   * Standard job: 5 attempts, exponential backoff
   */
  standard: (): JobsOptions => ({
    attempts: 5,
    backoff: BACKOFF_STRATEGIES.exponential(),
    removeOnComplete: true,
    removeOnFail: true,
  }),

  /**
   * Reliable job: 10 attempts, slow backoff, keep failed jobs
   */
  reliable: (): JobsOptions => ({
    attempts: 10,
    backoff: BACKOFF_STRATEGIES.slow(),
    removeOnComplete: true,
    removeOnFail: true,
  }),

  /**
   * Critical job: many attempts, keep everything
   */
  critical: (): JobsOptions => ({
    attempts: 20,
    backoff: BACKOFF_STRATEGIES.exponential(2000),
    removeOnComplete: false,
    removeOnFail: false,
  }),
} as const;

/**
 * Add job to queue with standard options and correlationId
 */
export async function addStandardJob<T extends Record<string, unknown>>(
  queue: Queue,
  jobName: string,
  payload: T,
  options: JobsOptions,
  metadata?: RequestMetadata | unknown
): Promise<Job<T & StandardJobPayload>> {
  const enrichedPayload = enrichJobPayloadWithMetadata(payload, metadata);

  return (await queue.add(jobName, enrichedPayload, options)) as Job<
    T & StandardJobPayload
  >;
}
