/**
 * Константы для BullMQ очередей
 */

import type { QueueOptions } from "./types";

/**
 * Опции очереди по умолчанию
 * - 3 попытки с exponential backoff (задержка 2000ms)
 * - Удаление завершенных задач
 * - Сохранение неудачных задач для анализа
 */
export const DEFAULT_QUEUE_OPTIONS: QueueOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

/**
 * Базовые имена очередей (могут быть переиспользованы в разных сервисах)
 * Специфичные имена очередей должны быть определены в соответствующих сервисах
 */
export const QUEUE_NAMES = {
  // Deployment Service очереди
  DEPLOYMENT: "deployment-queue",
  AGENT_INSTALLATION: "agent-installation-queue",
  INFRASTRUCTURE: "infrastructure-queue",
  CODEGEN: "codegen-queue",
  GRAPH: "graph-queue",
  RUNNER_AGENT: "runner-agent-queue",
  METRICS: "metrics-queue",
  BILLING: "billing-queue",
  AUTH: "auth-queue",
} as const;
