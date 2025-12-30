/**
 * BullMQ Metrics utilities
 * Provides standardized metrics collection for BullMQ queues
 */

import type { Queue, Job } from "bullmq";

/**
 * Queue Metrics
 */
export type QueueMetrics = {
  /**
   * Queue name
   */
  queueName: string;

  /**
   * Active jobs count
   */
  active: number;

  /**
   * Waiting jobs count
   */
  waiting: number;

  /**
   * Delayed jobs count
   */
  delayed: number;

  /**
   * Completed jobs count
   */
  completed: number;

  /**
   * Failed jobs count
   */
  failed: number;

  /**
   * Paused status
   */
  paused: boolean;

  /**
   * Timestamp when metrics were collected
   */
  timestamp: number;
}

/**
 * Job Metrics
 */
export type JobMetrics = {
  /**
   * Job ID
   */
  jobId: string;

  /**
   * Job name
   */
  name: string;

  /**
   * Job state
   */
  state: string;

  /**
   * Processing duration (for completed jobs)
   */
  duration?: number;

  /**
   * Number of attempts
   */
  attempts: number;

  /**
   * Job progress (0-100)
   */
  progress?: number;

  /**
   * Timestamp when job was created
   */
  createdAt?: number;

  /**
   * Timestamp when job was processed
   */
  processedAt?: number;

  /**
   * Timestamp when job was completed
   */
  completedAt?: number;

  /**
   * Timestamp when job failed
   */
  failedAt?: number;
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics(queue: Queue): Promise<QueueMetrics> {
  const [active, waiting, delayed, completed, failed, paused] =
    await Promise.all([
      queue.getActiveCount(),
      queue.getWaitingCount(),
      queue.getDelayedCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.isPaused(),
    ]);

  return {
    queueName: queue.name,
    active,
    waiting,
    delayed,
    completed,
    failed,
    paused,
    timestamp: Date.now(),
  };
}

/**
 * Get job metrics
 */
export async function getJobMetrics(job: Job): Promise<JobMetrics> {
  const state = await job.getState();

  const metrics: JobMetrics = {
    jobId: job.id || "",
    name: job.name,
    state,
    attempts: job.attemptsMade,
    progress: typeof job.progress === "number" ? job.progress : undefined,
    createdAt: job.timestamp,
    processedAt: job.processedOn,
    completedAt: job.finishedOn,
    failedAt: job.failedReason ? job.processedOn : undefined,
  };

  // Calculate duration for completed jobs
  if (job.processedOn && job.finishedOn) {
    metrics.duration = job.finishedOn - job.processedOn;
  } else if (job.processedOn) {
    // For active jobs, calculate current duration
    metrics.duration = Date.now() - job.processedOn;
  }

  return metrics;
}

/**
 * Get job metrics for multiple jobs
 */
export async function getJobsMetrics(jobs: Job[]): Promise<JobMetrics[]> {
  return Promise.all(jobs.map((job) => getJobMetrics(job)));
}

/**
 * Queue Metrics Summary
 */
export type QueueMetricsSummary = {
  /**
   * Total jobs in queue
   */
  total: number;

  /**
   * Success rate (completed / (completed + failed))
   */
  successRate: number;

  /**
   * Average job duration (for completed jobs)
   */
  averageDuration?: number;
} & QueueMetrics

/**
 * Get queue metrics summary with additional calculations
 */
export async function getQueueMetricsSummary(
  queue: Queue,
  sampleSize: number = 100
): Promise<QueueMetricsSummary> {
  const metrics = await getQueueMetrics(queue);
  const total = metrics.active + metrics.waiting + metrics.delayed;

  // Calculate success rate
  const successRate =
    metrics.completed + metrics.failed > 0
      ? metrics.completed / (metrics.completed + metrics.failed)
      : 1;

  // Calculate average duration from recent completed jobs
  let averageDuration: number | undefined;
  try {
    const completedJobs = await queue.getJobs(["completed"], 0, sampleSize - 1);
    if (completedJobs.length > 0) {
      const durations: number[] = [];
      for (const job of completedJobs) {
        if (job.processedOn && job.finishedOn) {
          durations.push(job.finishedOn - job.processedOn);
        }
      }
      if (durations.length > 0) {
        averageDuration =
          durations.reduce((sum, duration) => sum + duration, 0) /
          durations.length;
      }
    }
  } catch (_error) {
    // Ignore errors when calculating average duration (non-critical metric)
    // This can happen if Redis is temporarily unavailable
  }

  return {
    ...metrics,
    total,
    successRate,
    averageDuration,
  };
}
