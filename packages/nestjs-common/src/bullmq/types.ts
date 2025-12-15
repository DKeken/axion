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
