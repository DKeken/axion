/**
 * Типы для BullMQ очередей
 */

/**
 * Опции для очереди BullMQ
 */
export type QueueOptions = {
  attempts: number;
  backoff: {
    type: "exponential" | "fixed";
    delay: number;
  };
  removeOnComplete: boolean;
  removeOnFail: boolean;
  /**
   * Optional idempotency key for BullMQ.
   * When provided, BullMQ will deduplicate jobs with the same jobId.
   */
  jobId?: string;
  /**
   * Optional per-queue limiter configuration (kept here for convenience).
   * Note: this is usually applied at Queue/Worker construction time.
   */
  limiter?: { max: number; duration: number };
  /**
   * Optional deduplication window (BullMQ feature; enabled only when supported).
   * If `jobId` is provided, it will be reused as dedupe id.
   */
  dedupe?: { ttlMs: number };
};

/**
 * Конфигурация подключения к Redis для BullMQ
 */
export type BullMQConnectionConfig = {
  host: string;
  port: number;
  password?: string;
};

/**
 * Опции для настройки BullMQ модуля
 */
export type BullMQModuleOptions = {
  connection: BullMQConnectionConfig;
};

/**
 * Асинхронные опции для настройки BullMQ модуля
 */
export type BullMQModuleAsyncOptions = {
  useFactory: () => Promise<BullMQModuleOptions> | BullMQModuleOptions;
};
