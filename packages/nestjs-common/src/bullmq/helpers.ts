/**
 * Утилиты для работы с BullMQ
 */

import type { BullMQConnectionConfig } from "./types";

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
  } catch (error) {
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
  return parseRedisUrl(url);
}
