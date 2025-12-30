/**
 * Утилиты для работы с BullMQ
 */

import type { Job, JobsOptions, Queue } from "bullmq";

import type { BullMQConnectionConfig , QueueOptions } from "./types";

/**
 * Парсит Redis URL в конфигурацию подключения для BullMQ
 *
 * @param redisUrl - Redis URL в формате redis://[:password@]host:port
 * @returns Конфигурация подключения к Redis
 *
 * @example
 * parseRedisUrl("redis://localhost:6379")
 * // { host: "localhost", port: 6379 }
 *
 * @example
 * parseRedisUrl("redis://:password@localhost:6379")
 * // { host: "localhost", port: 6379, password: "password" }
 */
export function parseRedisUrl(redisUrl: string): BullMQConnectionConfig {
  try {
    const url = new URL(redisUrl);
    const password = url.password || undefined;
    const host = url.hostname || "localhost";
    const port = parseInt(url.port || "6379", 10);

    return {
      host,
      port,
      password,
    };
  } catch (_error) {
    // Если URL некорректный, используем значения по умолчанию
    return {
      host: "localhost",
      port: 6379,
    };
  }
}

/**
 * Создает конфигурацию подключения к Redis для BullMQ из переменной окружения
 *
 * @param redisUrl - Redis URL из переменной окружения (по умолчанию redis://localhost:6379)
 * @returns Конфигурация подключения к Redis
 */
export function createBullMQConnectionConfig(
  redisUrl?: string
): BullMQConnectionConfig {
  const url = redisUrl || process.env.REDIS_URL || "redis://localhost:6379";
  const config = parseRedisUrl(url);
  
  // Lazy connect в dev чтобы не блокировать старт сервиса
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    (config as unknown as { lazyConnect: boolean }).lazyConnect = true;
  }
  
  return config;
}

/**
 * Convert our simplified QueueOptions into BullMQ job options.
 */
export function toBullMQJobOptions(options: QueueOptions): JobsOptions {
  const jobOptions: JobsOptions = {
    attempts: options.attempts,
    backoff: {
      type: options.backoff.type === "exponential" ? "exponential" : "fixed",
      delay: options.backoff.delay,
    },
    removeOnComplete: options.removeOnComplete,
    removeOnFail: options.removeOnFail,
  };

  if (options.jobId) {
    (jobOptions as unknown as { jobId: string }).jobId = options.jobId;
  }

  // Optional: BullMQ deduplication window (supported in BullMQ v4+).
  // We only enable it when both ttlMs and jobId are provided.
  if (options.dedupe?.ttlMs && options.jobId) {
    (
      jobOptions as unknown as { deduplication: { id: string; ttl: number } }
    ).deduplication = {
      id: options.jobId,
      ttl: options.dedupe.ttlMs,
    };
  }

  return jobOptions;
}

/**
 * Standard job add helper (idempotency/backoff/remove policies).
 */
export async function addStandardJob(
  queue: Queue,
  jobName: string,
  payload: unknown,
  options: QueueOptions
): Promise<Job> {
  // BullMQ Queue/Job have complex conditional generics; keep this helper minimal.
  return await (queue as unknown as Queue).add(
    jobName,
    payload,
    toBullMQJobOptions(options)
  );
}
