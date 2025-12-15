/**
 * Имена SSH очередей для BullMQ
 */

export const SSH_QUEUE_NAMES = {
  /**
   * Очередь для тестирования SSH подключений
   */
  CONNECTION: "ssh-connection-queue",

  /**
   * Очередь для выполнения SSH команд
   */
  COMMAND: "ssh-command-queue",

  /**
   * Очередь для сбора информации о сервере
   */
  INFO_COLLECTION: "ssh-info-collection-queue",
} as const;
