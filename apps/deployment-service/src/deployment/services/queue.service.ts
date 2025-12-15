import {
  DEFAULT_QUEUE_OPTIONS,
  QUEUE_NAMES,
  type QueueOptions,
} from "@axion/nestjs-common";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";

import type {
  DeploymentJobPayload,
  AgentInstallationJobPayload,
} from "@/deployment/services/types";
import { RequestMetadata } from "@axion/contracts";

/**
 * Queue Service
 * Управление задачами деплоя и установки агентов через BullMQ
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.DEPLOYMENT)
    private readonly deploymentQueue: Queue<DeploymentJobPayload>,
    @InjectQueue(QUEUE_NAMES.AGENT_INSTALLATION)
    private readonly agentInstallationQueue: Queue<AgentInstallationJobPayload>
  ) {}

  /**
   * Создает задачу деплоя в очереди
   */
  async createDeploymentJob(
    deploymentId: string,
    data: Omit<DeploymentJobPayload, "deploymentId">,
    options: QueueOptions = DEFAULT_QUEUE_OPTIONS
  ): Promise<string> {
    this.logger.log(`Creating deployment job for deployment ${deploymentId}`);

    try {
      const job = await this.deploymentQueue.add(
        QUEUE_NAMES.DEPLOYMENT,
        {
          deploymentId,
          ...data,
        } satisfies DeploymentJobPayload,
        {
          attempts: options.attempts,
          backoff: {
            type:
              options.backoff.type === "exponential" ? "exponential" : "fixed",
            delay: options.backoff.delay,
          },
          removeOnComplete: options.removeOnComplete,
          removeOnFail: options.removeOnFail,
        } satisfies QueueOptions
      );

      this.logger.log(
        `Deployment job ${job.id} created for deployment ${deploymentId}`
      );

      return job.id!;
    } catch (error) {
      this.logger.error(
        `Failed to create deployment job for ${deploymentId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Отменяет задачу деплоя в очереди
   */
  async cancelDeploymentJob(jobId: string): Promise<void> {
    this.logger.log(`Canceling deployment job ${jobId}`);

    try {
      const job = await this.deploymentQueue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.log(`Deployment job ${jobId} removed`);
      } else {
        this.logger.warn(`Deployment job ${jobId} not found`);
      }
    } catch (error) {
      this.logger.error(`Failed to cancel deployment job ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Получает статус задачи деплоя
   */
  async getJobStatus(jobId: string): Promise<{
    status: string;
    progress?: number;
  }> {
    this.logger.log(`Getting status for job ${jobId}`);

    try {
      const job = await this.deploymentQueue.getJob(jobId);
      if (!job) {
        return { status: "not_found" };
      }

      const state = await job.getState();
      return {
        status: state,
        progress: typeof job.progress === "number" ? job.progress : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get status for job ${jobId}`, error);
      return { status: "unknown" };
    }
  }

  /**
   * Создает задачу установки агента в очереди
   */
  async createAgentInstallationJob(
    serverId: string,
    metadata: RequestMetadata | undefined,
    options: QueueOptions = DEFAULT_QUEUE_OPTIONS
  ): Promise<string> {
    this.logger.log(`Creating agent installation job for server ${serverId}`);

    try {
      const job = await this.agentInstallationQueue.add(
        QUEUE_NAMES.AGENT_INSTALLATION,
        {
          serverId,
          metadata,
        } satisfies AgentInstallationJobPayload,
        {
          attempts: options.attempts,
          backoff: {
            type:
              options.backoff.type === "exponential" ? "exponential" : "fixed",
            delay: options.backoff.delay,
          },
          removeOnComplete: options.removeOnComplete,
          removeOnFail: options.removeOnFail,
        } satisfies QueueOptions
      );

      this.logger.log(
        `Agent installation job ${job.id} created for server ${serverId}`
      );

      return job.id!;
    } catch (error) {
      this.logger.error(
        `Failed to create agent installation job for ${serverId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Отменяет задачу установки агента в очереди
   */
  async cancelAgentInstallationJob(jobId: string): Promise<void> {
    this.logger.log(`Canceling agent installation job ${jobId}`);

    try {
      const job = await this.agentInstallationQueue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.log(`Agent installation job ${jobId} removed`);
      } else {
        this.logger.warn(`Agent installation job ${jobId} not found`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to cancel agent installation job ${jobId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Получает статус задачи установки агента
   */
  async getAgentInstallationJobStatus(jobId: string): Promise<{
    status: string;
    progress?: number;
  }> {
    this.logger.log(`Getting status for agent installation job ${jobId}`);

    try {
      const job = await this.agentInstallationQueue.getJob(jobId);
      if (!job) {
        return { status: "not_found" };
      }

      const state = await job.getState();
      return {
        status: state,
        progress: typeof job.progress === "number" ? job.progress : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get status for agent installation job ${jobId}`,
        error
      );
      return { status: "unknown" };
    }
  }

  /**
   * Возвращает конфигурацию очереди по умолчанию (может использоваться вызывающим кодом)
   */
  getDefaultOptions(): QueueOptions {
    return DEFAULT_QUEUE_OPTIONS;
  }
}
