import {
  createError as createContractError,
  createAgentStatusResponse,
  ServerStatus,
  serverStatusToDbString,
  type AgentStatusResponse,
  type GetAgentStatusRequest,
  type AgentStatus,
  RequestMetadata,
} from "@axion/contracts";
import { CatchError, SshQueueService } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { verifyServerAccess } from "@/infrastructure/helpers/server-access.helper";
import { type ServerRepository } from "@/infrastructure/repositories/server.repository";

@Injectable()
export class AgentStatusService extends BaseService {
  constructor(
    private readonly serverRepository: ServerRepository,
    private readonly sshQueueService: SshQueueService
  ) {
    super(AgentStatusService.name);
  }

  @CatchError({ operation: "getting agent status" })
  async getStatus(data: GetAgentStatusRequest): Promise<AgentStatusResponse> {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) {
      return metadataCheck.response as AgentStatusResponse;
    }

    const access = await verifyServerAccess(
      this.serverRepository,
      data.serverId,
      data.metadata
    );
    if (!access.success) {
      return access.response as AgentStatusResponse;
    }

    const server = await this.serverRepository.findById(data.serverId);
    if (!server) {
      return this.createNotFoundResponse(
        "Server",
        data.serverId
      ) as AgentStatusResponse;
    }

    if (!server.agentId) {
      const validationError = createContractError(
        "VALIDATION_ERROR",
        `Agent is not installed on server ${data.serverId}`,
        {}
      );
      return {
        status: 2, // STATUS_ERROR
        error: validationError,
      };
    }

    try {
      const jobId = await this.sshQueueService.createCheckAgentStatusJob(
        data.serverId,
        data.metadata as unknown as RequestMetadata
      );

      const jobResult = await this.sshQueueService.waitForCommandJobResult(
        jobId,
        20000
      );

      const commandResult = jobResult.commandResult;
      const connected =
        jobResult.success &&
        !!commandResult &&
        commandResult.exitCode === 0 &&
        commandResult.stdout.includes("AGENT_OK");

      const statusToSet = serverStatusToDbString(
        connected
          ? ServerStatus.SERVER_STATUS_CONNECTED
          : ServerStatus.SERVER_STATUS_ERROR
      );

      await this.serverRepository.update(server.id, {
        status: statusToSet,
      });

      if (connected) {
        await this.serverRepository.updateLastConnected(server.id);
      }

      const agentStatus: AgentStatus = {
        agentId: server.agentId,
        serverId: server.id,
        connected,
        lastHeartbeat: connected
          ? Date.now()
          : server.lastConnectedAt?.getTime() || 0,
        metrics: {
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0,
          activeContainers: 0,
        },
        deployedProjects: [],
      };

      return createAgentStatusResponse(agentStatus);
    } catch (error) {
      this.logger.error(
        `Failed to get agent status for server ${data.serverId}`,
        error
      );

      const validationError = createContractError(
        "AGENT_STATUS_ERROR",
        error instanceof Error ? error.message : "Unknown error",
        {}
      );

      await this.serverRepository.update(server.id, {
        status: serverStatusToDbString(ServerStatus.SERVER_STATUS_ERROR),
      });

      return {
        status: 2, // STATUS_ERROR
        error: validationError,
      };
    }
  }
}
