import type {
  DeployProjectCommand,
  DeployProjectResponse as RunnerDeployProjectResponse,
  DeploymentStatusResponse as RunnerDeploymentStatusResponse,
  CancelDeploymentRequest,
  GetDeploymentStatusRequest,
} from "@axion/contracts/generated/runner-agent/deployment";
import {
  RUNNER_AGENT_SERVICE_NAME,
  RUNNER_AGENT_SERVICE_PATTERNS,
} from "@axion/contracts";
import { BaseService } from "@axion/shared";
import { firstValueFrom } from "rxjs";
import { Inject, Injectable, Optional } from "@nestjs/common";
import type { ClientProxy } from "@nestjs/microservices";

/**
 * Runner Agent Service
 * Общение с Runner Agent через Kafka для управления деплоями
 *
 * Использует Kafka для отправки команд в Runner Agent
 * Runner Agent обрабатывает команды и отправляет события обратно через Kafka
 */
@Injectable()
export class RunnerAgentService extends BaseService {
  constructor(
    @Optional()
    @Inject(RUNNER_AGENT_SERVICE_NAME)
    private readonly runnerAgentClient: ClientProxy | null
  ) {
    super(RunnerAgentService.name);
  }

  /**
   * Отправляет команду деплоя в Runner Agent
   */
  async deployProject(
    command: DeployProjectCommand
  ): Promise<RunnerDeployProjectResponse["data"]> {
    if (!this.runnerAgentClient) {
      this.logger.warn(
        "Runner Agent client not available - returning stub response"
      );
      return {
        deploymentId: command.deploymentId || "",
        accepted: true,
        message: "Deployment command accepted (stub)",
      };
    }

    try {
      this.logger.log(
        `Sending deploy command to agent ${command.agentId} for deployment ${command.deploymentId}`
      );

      // Send command via Kafka
      // Note: DeployProjectCommand doesn't have metadata field, so we send command directly
      const response = await firstValueFrom<RunnerDeployProjectResponse>(
        this.runnerAgentClient.send(
          RUNNER_AGENT_SERVICE_PATTERNS.DEPLOY_PROJECT,
          command
        )
      );

      if (response.error) {
        throw new Error(
          response.error.message || "Failed to deploy project on agent"
        );
      }

      if (!response.data) {
        throw new Error("Deploy response has no data");
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to send deploy command to Runner Agent (agentId: ${command.agentId}, deploymentId: ${command.deploymentId})`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Отправляет команду отмены деплоя в Runner Agent
   */
  async cancelDeployment(agentId: string, deploymentId: string): Promise<void> {
    if (!this.runnerAgentClient) {
      this.logger.warn(
        `Runner Agent client not available - skipping cancel for deployment ${deploymentId}`
      );
      return;
    }

    try {
      this.logger.log(
        `Sending cancel command to agent ${agentId} for deployment ${deploymentId}`
      );

      const request: CancelDeploymentRequest = {
        agentId,
        deploymentId,
      };

      // Send command via Kafka
      await firstValueFrom(
        this.runnerAgentClient.send(
          RUNNER_AGENT_SERVICE_PATTERNS.CANCEL_DEPLOYMENT,
          request
        )
      );

      this.logger.log(
        `Cancel command sent successfully to agent ${agentId} for deployment ${deploymentId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to send cancel command to Runner Agent (agentId: ${agentId}, deploymentId: ${deploymentId})`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Получает статус деплоя от Runner Agent
   */
  async getDeploymentStatus(
    agentId: string,
    deploymentId: string
  ): Promise<RunnerDeploymentStatusResponse["data"] | null> {
    if (!this.runnerAgentClient) {
      this.logger.debug(
        `Runner Agent client not available - returning null for deployment status (agentId: ${agentId}, deploymentId: ${deploymentId})`
      );
      return null;
    }

    try {
      this.logger.debug(
        `Getting deployment status from agent ${agentId} for deployment ${deploymentId}`
      );

      const request: GetDeploymentStatusRequest = {
        agentId,
        deploymentId,
      };

      // Send request via Kafka
      const response = await firstValueFrom<RunnerDeploymentStatusResponse>(
        this.runnerAgentClient.send(
          RUNNER_AGENT_SERVICE_PATTERNS.GET_DEPLOYMENT_STATUS,
          request
        )
      );

      if (response.error) {
        this.logger.warn(
          `Failed to get deployment status from agent (agentId: ${agentId}, deploymentId: ${deploymentId}): ${response.error.message}`
        );
        return null;
      }

      return response.data || null;
    } catch (error) {
      this.logger.warn(
        `Failed to get deployment status from Runner Agent (agentId: ${agentId}, deploymentId: ${deploymentId})`,
        error instanceof Error ? error.message : String(error)
      );
      return null; // При ошибке возвращаем null, чтобы не ломать основной flow
    }
  }

  /**
   * Отправляет команду rollback в Runner Agent
   */
  async rollbackDeployment(
    _agentId: string,
    _deploymentId: string,
    _targetDeploymentId: string
  ): Promise<void> {
    try {
      // TODO: Реализовать отправку команды rollback через gRPC/Kafka
      // await firstValueFrom(
      //   this.runnerAgentClient.send('rollbackDeployment', {
      //     agentId,
      //     deploymentId,
      //     targetDeploymentId,
      //   })
      // );

      this.logger.log(`Rollback command (stub) sent to Runner Agent`);
    } catch (error) {
      this.logger.error(
        "Failed to send rollback command to Runner Agent",
        error
      );
      throw error;
    }
  }
}
