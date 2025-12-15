/**
 * Типы для SSH операций через BullMQ
 */

import type { RequestMetadata, ServerInfo } from "@axion/contracts";

/**
 * Типы SSH операций
 */
export enum SshOperationType {
  TEST_CONNECTION = "test_connection",
  EXECUTE_COMMAND = "execute_command",
  COLLECT_INFO = "collect_info",
}

/**
 * Статусы SSH job
 */
export enum SshJobStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  SUCCESS = "success",
  FAILED = "failed",
}

/**
 * Информация для SSH подключения
 */
export type SshConnectionInfo = {
  host: string;
  port: number;
  username: string;
  privateKey?: string | null;
  password?: string | null;
};

/**
 * Payload для задачи тестирования SSH подключения
 */
export type SshTestConnectionJobPayload = {
  /**
   * ID сервера (если тестируем существующий сервер)
   */
  serverId?: string;

  /**
   * Информация о подключении (если тестируем перед созданием)
   */
  connectionInfo?: SshConnectionInfo;

  /**
   * Metadata для авторизации (нужно для получения сервера из БД)
   */
  metadata?: RequestMetadata;
};

/**
 * Payload для задачи выполнения SSH команды
 */
export type SshExecuteCommandJobPayload = {
  /**
   * ID сервера
   */
  serverId: string;

  /**
   * Команда для выполнения
   */
  command: string;

  /**
   * Таймаут выполнения команды (в миллисекундах)
   */
  timeout?: number;

  /**
   * Выполнять команду в safe mode (не бросать ошибку при неудаче)
   */
  safe?: boolean;

  /**
   * Metadata для авторизации
   */
  metadata?: RequestMetadata;
};

/**
 * Payload для задачи сбора информации о сервере
 */
export type SshCollectInfoJobPayload = {
  /**
   * ID сервера
   */
  serverId: string;

  /**
   * Metadata для авторизации
   */
  metadata?: RequestMetadata;
};

/**
 * Результат SSH операции
 */
export type SshJobResult = {
  /**
   * Успешно ли выполнена операция
   */
  success: boolean;

  /**
   * Результат тестирования подключения
   */
  connectionResult?: {
    connected: boolean;
    dockerAvailable: boolean;
    serverInfo: ServerInfo;
    errorMessage?: string;
  };

  /**
   * Результат выполнения команды
   */
  commandResult?: {
    stdout: string;
    stderr: string;
    exitCode: number;
  };

  /**
   * Результат сбора информации
   */
  infoResult?: {
    serverInfo: ServerInfo;
  };

  /**
   * Сообщение об ошибке (если операция не удалась)
   */
  error?: string;
};
