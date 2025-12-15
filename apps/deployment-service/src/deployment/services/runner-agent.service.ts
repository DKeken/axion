import type {
  DeployProjectCommand,
  DeployProjectResponse as RunnerDeployProjectResponse,
  DeploymentStatusResponse as RunnerDeploymentStatusResponse,
} from "@axion/contracts/generated/runner-agent/deployment";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

/**
 * Runner Agent Service
 * Общение с Runner Agent через gRPC/Kafka для управления деплоями
 *
 * TODO: Реализовать полную интеграцию с Runner Agent когда будет готов gRPC сервер
 * Runner Agent - это внешний сервис, который будет доступен через gRPC/Kafka
 */
@Injectable()
export class RunnerAgentService extends BaseService {
  constructor() {
    super(RunnerAgentService.name);
  }

  /**
   * Отправляет команду деплоя в Runner Agent
   */
  async deployProject(
    command: DeployProjectCommand
  ): Promise<RunnerDeployProjectResponse["data"]> {
    try {
      // TODO: Реализовать отправку команды через gRPC/Kafka
      // const response = await firstValueFrom<RunnerDeployProjectResponse>(
      //   this.runnerAgentClient.send('deployProject', command)
      // );
      // return response.data;

      // Пока возвращаем заглушку
      this.logger.log(
        `Deploy command (stub) sent to agent ${command.agentId} for deployment ${command.deploymentId}`
      );
      return {
        deploymentId: command.deploymentId,
        accepted: true,
        message: "Deployment command accepted",
      };
    } catch (error) {
      this.logger.error("Failed to send deploy command to Runner Agent", error);
      // Пробрасываем оригинальную ошибку
      throw error;
    }
  }

  /**
   * Отправляет команду отмены деплоя в Runner Agent
   */
  async cancelDeployment(agentId: string, deploymentId: string): Promise<void> {
    try {
      // TODO: Реализовать отправку команды отмены через gRPC/Kafka
      // const request: RunnerCancelDeploymentRequest = { agentId, deploymentId };
      // await firstValueFrom(
      //   this.runnerAgentClient.send('cancelDeployment', request)
      // );

      this.logger.log(
        `Cancel command (stub) sent to agent ${agentId} for deployment ${deploymentId}`
      );
    } catch (error) {
      this.logger.error("Failed to send cancel command to Runner Agent", error);
      throw error;
    }
  }

  /**
   * Получает статус деплоя от Runner Agent
   */
  async getDeploymentStatus(
    _agentId: string,
    _deploymentId: string
  ): Promise<RunnerDeploymentStatusResponse | null> {
    try {
      // TODO: Реализовать получение статуса через gRPC/Kafka
      // const response = await firstValueFrom<RunnerDeploymentStatusResponse>(
      //   this.runnerAgentClient.send('getDeploymentStatus', {
      //     agentId,
      //     deploymentId,
      //   } as RunnerGetDeploymentStatusRequest)
      // );
      // return response;

      // Пока возвращаем null (будет использоваться статус из БД)
      this.logger.log(`Getting deployment status from Runner Agent (stub)`);
      return null;
    } catch (error) {
      this.logger.error(
        "Failed to get deployment status from Runner Agent",
        error
      );
      return null;
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
      this.logger.error("Failed to send rollback command to Runner Agent", error);
      throw error;
    }
  }
}
