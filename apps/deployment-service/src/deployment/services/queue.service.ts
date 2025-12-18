import { RequestMetadata } from "@axion/contracts";
import {
  DEFAULT_QUEUE_OPTIONS,
  QUEUE_NAMES,
  addStandardJob,
  type QueueOptions,
} from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue, type Job } from "bullmq";

import type {
  DeploymentJobPayload,
  AgentInstallationJobPayload,
} from "@/deployment/services/types";

/**
 * Queue Service
 * Управление задачами деплоя и установки агентов через BullMQ
 */
@Injectable()
export class QueueService extends BaseService {
  constructor(
    @InjectQueue(QUEUE_NAMES.DEPLOYMENT)
    private readonly deploymentQueue: Queue<DeploymentJobPayload>,
    @InjectQueue(QUEUE_NAMES.AGENT_INSTALLATION)
    private readonly agentInstallationQueue: Queue<AgentInstallationJobPayload>
  ) {
    super(QueueService.name);
  }

  private async addJob<TPayload extends object>(
    queue: Queue<TPayload>,
    queueName: string,
    jobId: string,
    payload: TPayload,
    options: QueueOptions
  ): Promise<string> {
    const job = await addStandardJob(queue, queueName, payload, {
      ...options,
      jobId,
    });

    if (!job.id) {
      throw new Error(`Job id is missing (queue=${queueName})`);
    }

    return String(job.id);
  }

  private async removeJobIfExists(queue: Queue, jobId: string): Promise<boolean> {
    const job: Job | undefined | null = await queue.getJob(jobId);
    if (!job) return false;

    await job.remove();
    return true;
  }

  private async getQueueJobStatus(queue: Queue, jobId: string): Promise<{
    status: string;
    progress?: number;
  }> {
    const job: Job | undefined | null = await queue.getJob(jobId);
    if (!job) return { status: "not_found" };

    const state = await job.getState();
    return {
      status: state,
      progress: typeof job.progress === "number" ? job.progress : undefined,
    };
  }

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
      const jobId = await this.addJob(
        this.deploymentQueue,
        QUEUE_NAMES.DEPLOYMENT,
        deploymentId,
        {
          deploymentId,
          ...data,
        } satisfies DeploymentJobPayload,
        options
      );

      this.logger.log(
        `Deployment job ${jobId} created for deployment ${deploymentId}`
      );
      return jobId;
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
      const removed = await this.removeJobIfExists(this.deploymentQueue, jobId);
      if (removed) {
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
      return await this.getQueueJobStatus(this.deploymentQueue, jobId);
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
      const jobId = await this.addJob(
        this.agentInstallationQueue,
        QUEUE_NAMES.AGENT_INSTALLATION,
        serverId,
        {
          serverId,
          metadata,
        } satisfies AgentInstallationJobPayload,
        options
      );

      this.logger.log(
        `Agent installation job ${jobId} created for server ${serverId}`
      );
      return jobId;
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
      const removed = await this.removeJobIfExists(
        this.agentInstallationQueue,
        jobId
      );
      if (removed) {
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
      return await this.getQueueJobStatus(this.agentInstallationQueue, jobId);
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
