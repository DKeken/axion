import {
  INFRASTRUCTURE_SERVICE_NAME,
  INFRASTRUCTURE_SERVICE_PATTERNS,
  type InstallAgentResponse,
} from "@axion/contracts";
import { QUEUE_NAMES } from "@axion/nestjs-common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Job } from "bullmq";
import { firstValueFrom } from "rxjs";

import type { AgentInstallationJobPayload } from "@/deployment/services/types";

/**
 * Agent Installation Processor
 * Обрабатывает задачи установки агентов из очереди BullMQ
 */
@Processor(QUEUE_NAMES.AGENT_INSTALLATION)
@Injectable()
export class AgentInstallationProcessor extends WorkerHost {
  private readonly logger = new Logger(AgentInstallationProcessor.name);

  constructor(
    @Optional()
    @Inject(INFRASTRUCTURE_SERVICE_NAME)
    private readonly infrastructureClient: ClientProxy | null
  ) {
    super();
  }

  async process(job: Job<AgentInstallationJobPayload>): Promise<void> {
    const { serverId, metadata } = job.data;

    this.logger.log(
      `Processing agent installation job ${job.id} for server ${serverId}`
    );

    if (!this.infrastructureClient) {
      throw new Error("Infrastructure service client not available");
    }

    try {
      // Вызываем Infrastructure Service для установки агента
      const response = await firstValueFrom<InstallAgentResponse>(
        this.infrastructureClient.send(
          INFRASTRUCTURE_SERVICE_PATTERNS.INSTALL_AGENT,
          {
            metadata,
            serverId,
          }
        )
      );

      if (response.error) {
        throw new Error(
          `Agent installation failed: ${response.error.message || "Unknown error"}`
        );
      }

      if (!response.data) {
        throw new Error("Agent installation response has no data");
      }

      this.logger.log(
        `Agent installation completed for server ${serverId}. Agent ID: ${response.data.agentId || "unknown"}`
      );

      // В будущем здесь можно обновить статус сервера/агента в БД
      // если понадобится хранить эту информацию в Deployment Service
    } catch (error) {
      this.logger.error(
        `Failed to install agent on server ${serverId} (job ${job.id})`,
        error
      );

      // Логируем ошибку и пробрасываем для retry logic BullMQ
      this.logger.error(
        `Failed to process agent installation job ${job.id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
      // Пробрасываем оригинальную ошибку для retry logic BullMQ
      throw error;
    }
  }
}
