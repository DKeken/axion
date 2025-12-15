/**
 * Agent Installation Service
 * Установка Axion Runner Agent на сервер через SSH
 */

import { randomUUID } from "crypto";

import {
  createInstallAgentResponse,
  createError as createContractError,
  type InstallAgentRequest,
  type InstallAgentResponse,
  ServerStatus,
  serverStatusToDbString,
  RequestMetadata,
  Status,
} from "@axion/contracts";
import { CatchError, SshQueueService } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { verifyServerAccess } from "@/infrastructure/helpers/server-access.helper";
import { type ServerRepository } from "@/infrastructure/repositories/server.repository";

@Injectable()
export class AgentInstallationService extends BaseService {
  constructor(
    private readonly serverRepository: ServerRepository,
    private readonly sshQueueService: SshQueueService
  ) {
    super(AgentInstallationService.name);
  }

  @CatchError({ operation: "installing agent" })
  async installAgent(data: InstallAgentRequest): Promise<InstallAgentResponse> {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) {
      const errorResponse = metadataCheck.response as {
        status: number;
        error?: {
          code: string;
          message: string;
          details: Record<string, string>;
        };
      };
      return {
        status: errorResponse.status as Status,
        error: errorResponse.error,
      };
    }

    // Проверяем доступ к серверу
    const access = await verifyServerAccess(
      this.serverRepository,
      data.serverId,
      data.metadata
    );
    if (!access.success) {
      const errorResponse = access.response as {
        status: number;
        error?: {
          code: string;
          message: string;
          details: Record<string, string>;
        };
      };
      return {
        status: errorResponse.status as Status,
        error: errorResponse.error,
      };
    }

    // Получаем сервер из БД
    const server = await this.serverRepository.findById(data.serverId);
    if (!server) {
      const notFoundResponse = this.createNotFoundResponse(
        "Server",
        data.serverId
      ) as {
        status: number;
        error?: {
          code: string;
          message: string;
          details: Record<string, string>;
        };
      };
      return {
        status: notFoundResponse.status as Status,
        error: notFoundResponse.error,
      };
    }

    // Проверяем, что агент еще не установлен
    if (server.agentId) {
      const validationError = createContractError(
        "VALIDATION_ERROR",
        `Agent already installed on server ${data.serverId}`,
        {}
      );
      return {
        status: 2, // STATUS_ERROR
        error: validationError,
      };
    }

    // Генерируем agent_id
    const agentId = randomUUID();
    const installationLog: string[] = [];

    try {
      // Обновляем статус на INSTALLING и устанавливаем agentId
      await this.serverRepository.updateAgentId(
        data.serverId,
        agentId,
        serverStatusToDbString(ServerStatus.SERVER_STATUS_INSTALLING)
      );

      installationLog.push(`Generated agent ID: ${agentId}`);
      installationLog.push(`Checking Docker installation...`);

      // Проверяем Docker через SSH команду
      const dockerCheckJobId =
        await this.sshQueueService.createExecuteCommandJob({
          serverId: data.serverId,
          command: "docker --version",
          safe: true,
          metadata: data.metadata as unknown as RequestMetadata,
        });

      const dockerCheckResult =
        await this.sshQueueService.waitForCommandJobResult(
          dockerCheckJobId,
          30000 // 30 секунд таймаут
        );

      if (!dockerCheckResult.success || !dockerCheckResult.commandResult) {
        throw new Error(
          "Docker is not installed or not accessible on the server"
        );
      }

      const dockerVersion = dockerCheckResult.commandResult.stdout.trim();
      installationLog.push(`Docker found: ${dockerVersion}`);

      // Выполняем stub команды установки агента
      // В будущем здесь будут реальные команды установки агента
      installationLog.push(`Installing agent...`);

      const installCommands = [
        "mkdir -p /opt/axion-agent",
        "echo 'Agent installation stub - will be replaced with real agent binary' > /opt/axion-agent/agent",
        "chmod +x /opt/axion-agent/agent",
      ];

      for (const command of installCommands) {
        const commandJobId = await this.sshQueueService.createExecuteCommandJob(
          {
            serverId: data.serverId,
            command,
            metadata: data.metadata as unknown as RequestMetadata,
          }
        );

        const commandResult =
          await this.sshQueueService.waitForCommandJobResult(
            commandJobId,
            60000 // 60 секунд таймаут
          );

        if (!commandResult.success || !commandResult.commandResult) {
          throw new Error(
            `Installation command failed: ${command}. Error: ${
              commandResult.commandResult?.stderr || commandResult.error
            }`
          );
        }

        installationLog.push(`✓ ${command}`);
      }

      installationLog.push(`Agent installation completed successfully`);

      // Обновляем статус на CONNECTED
      await this.serverRepository.updateAgentId(
        data.serverId,
        agentId,
        serverStatusToDbString(ServerStatus.SERVER_STATUS_CONNECTED)
      );

      // Возвращаем результат
      return createInstallAgentResponse({
        agentId,
        status: ServerStatus.SERVER_STATUS_CONNECTED,
        installationLog: installationLog.join("\n"),
        installedAt: Date.now(),
      });
    } catch (installError) {
      const errorMessage =
        installError instanceof Error ? installError.message : "Unknown error";

      this.logger.error(`Failed to install agent on server ${data.serverId}`, {
        error: errorMessage,
        agentId,
      });

      // Обновляем статус на ERROR и удаляем agentId
      try {
        await this.serverRepository.updateAgentId(
          data.serverId,
          null,
          serverStatusToDbString(ServerStatus.SERVER_STATUS_ERROR)
        );
      } catch (updateError) {
        this.logger.error(
          "Failed to update server status after installation error",
          updateError
        );
      }

      // Возвращаем ошибку
      const contractError = createContractError(
        "AGENT_INSTALLATION_FAILED",
        errorMessage,
        {}
      );
      return {
        status: 2, // STATUS_ERROR
        error: contractError,
      };
    }
  }
}
