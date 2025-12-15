/**
 * SSH Queue Service
 * Управление SSH задачами через BullMQ очереди
 */

import { DEFAULT_QUEUE_OPTIONS, type QueueOptions } from "../../bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";

import { SSH_CONSTANTS } from "../constants";
import { SSH_QUEUE_NAMES } from "../queue-names";
import type {
  SshTestConnectionJobPayload,
  SshExecuteCommandJobPayload,
  SshCollectInfoJobPayload,
  SshJobResult,
} from "../types";
import type { RequestMetadata } from "@axion/contracts";

@Injectable()
export class SshQueueService {
  private readonly logger = new Logger(SshQueueService.name);

  constructor(
    @InjectQueue(SSH_QUEUE_NAMES.CONNECTION)
    private readonly connectionQueue: Queue<SshTestConnectionJobPayload>,
    @InjectQueue(SSH_QUEUE_NAMES.COMMAND)
    private readonly commandQueue: Queue<SshExecuteCommandJobPayload>,
    @InjectQueue(SSH_QUEUE_NAMES.INFO_COLLECTION)
    private readonly infoCollectionQueue: Queue<SshCollectInfoJobPayload>
  ) {}

  /**
   * Создает задачу тестирования SSH подключения
   *
   * @param payload - данные для тестирования подключения
   * @param options - опции очереди
   * @returns job ID
   */
  async createTestConnectionJob(
    payload: SshTestConnectionJobPayload,
    options: QueueOptions = DEFAULT_QUEUE_OPTIONS
  ): Promise<string> {
    this.logger.log(
      `Creating SSH test connection job for server ${payload.serverId || "new connection"}`
    );

    try {
      const job = await this.connectionQueue.add(
        SSH_QUEUE_NAMES.CONNECTION,
        payload,
        {
          attempts: options.attempts,
          backoff: {
            type:
              options.backoff.type === "exponential" ? "exponential" : "fixed",
            delay: options.backoff.delay,
          },
          removeOnComplete: options.removeOnComplete,
          removeOnFail: options.removeOnFail,
        }
      );

      this.logger.log(
        `SSH test connection job ${job.id} created for server ${payload.serverId || "new connection"}`
      );

      return job.id!;
    } catch (error) {
      this.logger.error(`Failed to create SSH test connection job`, error);
      throw error;
    }
  }

  /**
   * Создает задачу выполнения SSH команды
   *
   * @param payload - данные для выполнения команды
   * @param options - опции очереди
   * @returns job ID
   */
  async createExecuteCommandJob(
    payload: SshExecuteCommandJobPayload,
    options: QueueOptions = DEFAULT_QUEUE_OPTIONS
  ): Promise<string> {
    this.logger.log(
      `Creating SSH command job for server ${payload.serverId}, command: ${payload.command.substring(0, 50)}...`
    );

    try {
      const job = await this.commandQueue.add(
        SSH_QUEUE_NAMES.COMMAND,
        payload,
        {
          attempts: options.attempts,
          backoff: {
            type:
              options.backoff.type === "exponential" ? "exponential" : "fixed",
            delay: options.backoff.delay,
          },
          removeOnComplete: options.removeOnComplete,
          removeOnFail: options.removeOnFail,
        }
      );

      this.logger.log(
        `SSH command job ${job.id} created for server ${payload.serverId}`
      );

      return job.id!;
    } catch (error) {
      this.logger.error(
        `Failed to create SSH command job for server ${payload.serverId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Создает задачу проверки статуса Axion Runner Agent
   * Использует безопасный режим выполнения команды
   */
  async createCheckAgentStatusJob(
    serverId: string,
    metadata?: RequestMetadata,
    options: QueueOptions = DEFAULT_QUEUE_OPTIONS
  ): Promise<string> {
    return this.createExecuteCommandJob(
      {
        serverId,
        command: SSH_CONSTANTS.AGENT_COMMANDS.CHECK_STATUS,
        timeout: SSH_CONSTANTS.DEFAULT_COMMAND_TIMEOUT,
        safe: true,
        metadata,
      },
      options
    );
  }

  /**
   * Создает задачу сбора информации о сервере
   *
   * @param payload - данные для сбора информации
   * @param options - опции очереди
   * @returns job ID
   */
  async createCollectInfoJob(
    payload: SshCollectInfoJobPayload,
    options: QueueOptions = DEFAULT_QUEUE_OPTIONS
  ): Promise<string> {
    this.logger.log(
      `Creating SSH info collection job for server ${payload.serverId}`
    );

    try {
      const job = await this.infoCollectionQueue.add(
        SSH_QUEUE_NAMES.INFO_COLLECTION,
        payload,
        {
          attempts: options.attempts,
          backoff: {
            type:
              options.backoff.type === "exponential" ? "exponential" : "fixed",
            delay: options.backoff.delay,
          },
          removeOnComplete: options.removeOnComplete,
          removeOnFail: options.removeOnFail,
        }
      );

      this.logger.log(
        `SSH info collection job ${job.id} created for server ${payload.serverId}`
      );

      return job.id!;
    } catch (error) {
      this.logger.error(
        `Failed to create SSH info collection job for server ${payload.serverId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Получает статус задачи из очереди подключений
   *
   * @param jobId - ID задачи
   * @returns статус задачи или null если не найдена
   */
  async getConnectionJobStatus(jobId: string) {
    try {
      const job = await this.connectionQueue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      return {
        id: job.id,
        state,
        progress: job.progress,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
      };
    } catch (error) {
      this.logger.error(`Failed to get connection job status ${jobId}`, error);
      return null;
    }
  }

  /**
   * Получает статус задачи из очереди команд
   *
   * @param jobId - ID задачи
   * @returns статус задачи или null если не найдена
   */
  async getCommandJobStatus(jobId: string) {
    try {
      const job = await this.commandQueue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      return {
        id: job.id,
        state,
        progress: job.progress,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
      };
    } catch (error) {
      this.logger.error(`Failed to get command job status ${jobId}`, error);
      return null;
    }
  }

  /**
   * Получает статус задачи из очереди сбора информации
   *
   * @param jobId - ID задачи
   * @returns статус задачи или null если не найдена
   */
  async getInfoCollectionJobStatus(jobId: string) {
    try {
      const job = await this.infoCollectionQueue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      return {
        id: job.id,
        state,
        progress: job.progress,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get info collection job status ${jobId}`,
        error
      );
      return null;
    }
  }

  /**
   * Ожидает результат выполнения задачи тестирования подключения
   * Использует polling для проверки статуса job (более надежно чем waitUntilFinished)
   *
   * @param jobId - ID задачи
   * @param timeout - таймаут ожидания в миллисекундах (по умолчанию 60 секунд)
   * @param pollInterval - интервал проверки в миллисекундах (по умолчанию 500ms)
   * @returns результат SSH операции
   */
  async waitForConnectionJobResult(
    jobId: string,
    timeout: number = 60000,
    pollInterval: number = 500
  ): Promise<SshJobResult> {
    const startTime = Date.now();

    try {
      while (Date.now() - startTime < timeout) {
        const jobStatus = await this.getConnectionJobStatus(jobId);
        if (!jobStatus) {
          throw new Error(`Job ${jobId} not found`);
        }

        // Если job завершен (completed или failed), получаем результат
        if (jobStatus.state === "completed" && jobStatus.returnvalue) {
          return jobStatus.returnvalue as SshJobResult;
        }

        if (jobStatus.state === "failed") {
          throw new Error(jobStatus.failedReason || `Job ${jobId} failed`);
        }

        // Если job еще выполняется, ждем и проверяем снова
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      // Таймаут
      throw new Error(`Job ${jobId} timeout after ${timeout}ms`);
    } catch (error) {
      this.logger.error(
        `Failed to wait for connection job result ${jobId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Ожидает результат выполнения задачи выполнения SSH команды
   * Использует polling для проверки статуса job
   *
   * @param jobId - ID задачи
   * @param timeout - таймаут ожидания в миллисекундах (по умолчанию 60 секунд)
   * @param pollInterval - интервал проверки в миллисекундах (по умолчанию 500ms)
   * @returns результат SSH операции
   */
  async waitForCommandJobResult(
    jobId: string,
    timeout: number = 60000,
    pollInterval: number = 500
  ): Promise<SshJobResult> {
    const startTime = Date.now();

    try {
      while (Date.now() - startTime < timeout) {
        const jobStatus = await this.getCommandJobStatus(jobId);
        if (!jobStatus) {
          throw new Error(`Job ${jobId} not found`);
        }

        // Если job завершен (completed или failed), получаем результат
        if (jobStatus.state === "completed" && jobStatus.returnvalue) {
          return jobStatus.returnvalue as SshJobResult;
        }

        if (jobStatus.state === "failed") {
          throw new Error(jobStatus.failedReason || `Job ${jobId} failed`);
        }

        // Если job еще выполняется, ждем и проверяем снова
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      // Таймаут
      throw new Error(`Job ${jobId} timeout after ${timeout}ms`);
    } catch (error) {
      this.logger.error(
        `Failed to wait for command job result ${jobId}`,
        error
      );
      throw error;
    }
  }
}
