import { DeploymentStatus, deploymentStatusToDbString } from "@axion/contracts";
import {
  QUEUE_NAMES,
  createBullMQConnectionConfig,
} from "@axion/nestjs-common";
import { InjectQueue } from "@nestjs/bullmq";
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Queue, QueueEvents } from "bullmq";

import { env } from "@/config/env";
import { DeploymentRepository } from "@/deployment/repositories/deployment.repository";
import type { DeploymentJobPayload } from "@/deployment/services/types";

@Injectable()
export class DeploymentQueueEventsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DeploymentQueueEventsService.name);
  private queueEvents?: QueueEvents;

  constructor(
    @InjectQueue(QUEUE_NAMES.DEPLOYMENT)
    private readonly deploymentQueue: Queue<DeploymentJobPayload>,
    private readonly deploymentRepository: DeploymentRepository
  ) {}

  async onModuleInit(): Promise<void> {
    const connection = createBullMQConnectionConfig(env.redisUrl);

    this.queueEvents = new QueueEvents(QUEUE_NAMES.DEPLOYMENT, {
      connection,
    });

    this.queueEvents.on("failed", async ({ jobId, failedReason }) => {
      await this.handleFailed(jobId, failedReason);
    });

    this.queueEvents.on("completed", async ({ jobId }) => {
      await this.handleCompleted(jobId);
    });

    this.queueEvents.on("error", (error) => {
      this.logger.error("QueueEvents error", error);
    });

    this.logger.log("Deployment queue events listener started");
  }

  async onModuleDestroy(): Promise<void> {
    await this.queueEvents?.close();
  }

  private async handleFailed(jobId: string, failedReason?: string) {
    try {
      const job = await this.deploymentQueue.getJob(jobId);
      if (!job) return;

      const { deploymentId } = job.data;

      // Ensure deployment is marked as failed even if processor crashed.
      await this.deploymentRepository.update(deploymentId, {
        status: deploymentStatusToDbString(
          DeploymentStatus.DEPLOYMENT_STATUS_FAILED
        ),
        completedAt: new Date(),
      });

      this.logger.warn(
        `Deployment job ${jobId} failed (deploymentId=${deploymentId}): ${failedReason || "unknown"}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle deployment job failure for job ${jobId}`,
        error
      );
    }
  }

  private async handleCompleted(jobId: string) {
    try {
      const job = await this.deploymentQueue.getJob(jobId);
      if (!job) return;

      const { deploymentId } = job.data;

      // Processor should set SUCCESS explicitly, but we keep a safety net.
      const deployment = await this.deploymentRepository.findById(deploymentId);
      if (!deployment) return;

      const pending = deploymentStatusToDbString(
        DeploymentStatus.DEPLOYMENT_STATUS_PENDING
      );
      const inProgress = deploymentStatusToDbString(
        DeploymentStatus.DEPLOYMENT_STATUS_IN_PROGRESS
      );

      if (deployment.status === pending || deployment.status === inProgress) {
        await this.deploymentRepository.update(deploymentId, {
          status: deploymentStatusToDbString(
            DeploymentStatus.DEPLOYMENT_STATUS_SUCCESS
          ),
          completedAt: new Date(),
        });
      }

      this.logger.log(
        `Deployment job ${jobId} completed (deploymentId=${deploymentId}, status=${deployment.status})`
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle deployment job completion for job ${jobId}`,
        error
      );
    }
  }
}
