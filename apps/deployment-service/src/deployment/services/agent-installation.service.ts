import {
  INFRASTRUCTURE_SERVICE_NAME,
  INFRASTRUCTURE_SERVICE_PATTERNS,
  type InstallAgentResponse,
} from "@axion/contracts";
import { BaseService } from "@axion/shared";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

import { QueueService } from "@/deployment/services/queue.service";

/**
 * Agent Installation Service
 * Координирует установку Runner Agent на серверы через очередь BullMQ
 */
@Injectable()
export class AgentInstallationService extends BaseService {
  constructor(
    private readonly queueService: QueueService,
    @Optional()
    @Inject(INFRASTRUCTURE_SERVICE_NAME)
    private readonly infrastructureClient: ClientProxy | null
  ) {
    super(AgentInstallationService.name);
  }

  /**
   * Устанавливает агента на сервер через очередь BullMQ
   */
  async installAgent(
    serverId: string,
    metadata: unknown
  ): Promise<{ jobId: string }> {
    this.logger.log(`Scheduling agent installation for server ${serverId}`);

    if (!this.infrastructureClient) {
      throw new Error("Infrastructure service client not available");
    }

    // Проверяем, что сервер существует
    try {
      const serverResponse = await firstValueFrom(
        this.infrastructureClient.send(
          INFRASTRUCTURE_SERVICE_PATTERNS.GET_SERVER,
          {
            metadata,
            serverId,
          }
        )
      );

      if (serverResponse.error) {
        const errorMessage = serverResponse.error.message || "Unknown error";
        this.logger.warn(
          `Server ${serverId} not found or not accessible: ${errorMessage}`
        );
        throw new Error(`Server not found: ${errorMessage}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to check server existence for ${serverId}`,
        error
      );
      // Пробрасываем ошибку дальше
      throw error;
    }

    // Создаем задачу в очереди
    const jobId = await this.queueService.createAgentInstallationJob(
      serverId,
      metadata
    );

    this.logger.log(
      `Agent installation job ${jobId} created for server ${serverId}`
    );

    return { jobId };
  }

  /**
   * Получает статус установки агента через Infrastructure Service
   */
  async getAgentStatus(
    serverId: string,
    metadata: unknown
  ): Promise<InstallAgentResponse | null> {
    if (!this.infrastructureClient) {
      this.logger.warn("Infrastructure service client not available");
      return null;
    }

    try {
      const response = await firstValueFrom<InstallAgentResponse>(
        this.infrastructureClient.send(
          INFRASTRUCTURE_SERVICE_PATTERNS.GET_AGENT_STATUS,
          {
            metadata,
            serverId,
          }
        )
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get agent status for server ${serverId}`,
        error
      );
      return null;
    }
  }
}
