import {
  DeploymentStatus,
  deploymentStatusToDbString,
  type ServiceDeploymentStatus as DeploymentServiceDeploymentStatus,
} from "@axion/contracts";
import {
  DeployProjectCommand,
  type ServiceDeploymentStatus as RunnerServiceDeploymentStatus,
} from "@axion/contracts/generated/runner-agent/deployment";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { type DeploymentRepository } from "@/deployment/repositories/deployment.repository";
import { RunnerAgentService } from "@/deployment/services/runner-agent.service";
import type { DeploymentJobPayload } from "@/deployment/services/types";

/**
 * Deployment Processor
 * Обрабатывает задачи деплоя из очереди BullMQ
 */
@Processor("deployment-queue")
@Injectable()
export class DeploymentProcessor extends WorkerHost {
  private readonly logger = new Logger(DeploymentProcessor.name);

  constructor(
    private readonly deploymentRepository: DeploymentRepository,
    private readonly runnerAgentService: RunnerAgentService
  ) {
    super();
  }

  async process(job: Job<DeploymentJobPayload>): Promise<void> {
    const { deploymentId, projectId, serverId, clusterId, config, envVars } =
      job.data;

    this.logger.log(
      `Processing deployment job ${job.id} for deployment ${deploymentId}`
    );

    try {
      // Обновляем статус на IN_PROGRESS
      await this.deploymentRepository.update(deploymentId, {
        status: deploymentStatusToDbString(
          DeploymentStatus.DEPLOYMENT_STATUS_IN_PROGRESS
        ),
        startedAt: new Date(),
      });

      // Определяем agentId (serverId или clusterId)
      const agentId = serverId || clusterId;
      if (!agentId) {
        throw new Error(
          "Either serverId or clusterId must be provided for deployment"
        );
      }

      // Отправляем команду деплоя в Runner Agent
      const deployCommand = {
        agentId,
        deploymentId,
        projectId,
        dockerStackYml: config?.dockerComposeYml || "",
        envVars: envVars || {},
        forceRedeploy: false,
      } satisfies DeployProjectCommand;

      const agentResponse =
        await this.runnerAgentService.deployProject(deployCommand);

      if (!agentResponse?.accepted) {
        throw new Error(
          `Deployment not accepted by agent: ${agentResponse?.message || "Unknown error"}`
        );
      }

      // Отслеживание прогресса деплоя
      // Периодически проверяем статус от Runner Agent и обновляем прогресс
      const maxStatusChecks = 60; // максимум 60 проверок (5 минут при интервале 5 секунд)
      const statusCheckInterval = 5000; // проверка каждые 5 секунд
      let deploymentCompleted = false;
      let statusCheckCount = 0;

      while (!deploymentCompleted && statusCheckCount < maxStatusChecks) {
        await new Promise((resolve) =>
          setTimeout(resolve, statusCheckInterval)
        );
        statusCheckCount++;

        try {
          const statusResponse =
            await this.runnerAgentService.getDeploymentStatus(
              agentId,
              deploymentId
            );

          if (statusResponse?.data) {
            const {
              status: agentStatus,
              serviceStatuses: agentServiceStatuses,
            } = statusResponse.data;

            // Обновляем статусы сервисов в БД
            if (agentServiceStatuses && agentServiceStatuses.length > 0) {
              await this.deploymentRepository.update(deploymentId, {
                serviceStatuses: agentServiceStatuses.map(
                  (runnerStatus: RunnerServiceDeploymentStatus) => {
                    // Преобразуем ServiceDeploymentStatus из Runner Agent
                    // (serviceId, serviceName, status, replicas, healthyReplicas, errorMessage, deployedAt)
                    // в формат для БД Deployment ServiceDeploymentStatus
                    // (serviceId, nodeId, serviceName, status, serverId, errorMessage, deployedAt)
                    // Все поля должны быть заполнены, используем пустые строки/0 для отсутствующих значений
                    const dbStatus: Omit<
                      DeploymentServiceDeploymentStatus,
                      "status"
                    > & { status: string } = {
                      serviceId: runnerStatus.serviceId || "",
                      // nodeId не приходит от Runner Agent, используем serviceId как fallback
                      nodeId: runnerStatus.serviceId || "",
                      serviceName: runnerStatus.serviceName || "",
                      // serverId не приходит от Runner Agent, используем пустую строку
                      serverId: "",
                      // errorMessage преобразуем из runner-agent формата, используем пустую строку если нет
                      errorMessage: runnerStatus.errorMessage || "",
                      // deployedAt может прийти от Runner Agent, используем его или 0
                      deployedAt: runnerStatus.deployedAt || 0,
                      status: runnerStatus.status
                        ? String(runnerStatus.status)
                        : "unknown",
                    };
                    return dbStatus;
                  }
                ),
              });
            }

            // Если Runner Agent вернул финальный статус, обновляем deployment
            if (
              agentStatus === DeploymentStatus.DEPLOYMENT_STATUS_SUCCESS ||
              agentStatus === DeploymentStatus.DEPLOYMENT_STATUS_FAILED
            ) {
              await this.deploymentRepository.update(deploymentId, {
                status: deploymentStatusToDbString(agentStatus),
                completedAt: new Date(),
              });
              deploymentCompleted = true;
              this.logger.log(
                `Deployment ${deploymentId} completed with status ${agentStatus}`
              );
              break;
            }
          }
        } catch (statusError) {
          // Логируем ошибку проверки статуса, но продолжаем цикл
          this.logger.warn(
            `Failed to get deployment status (attempt ${statusCheckCount}/${maxStatusChecks}): ${statusError instanceof Error ? statusError.message : String(statusError)}`
          );
        }
      }

      // Если не получили финальный статус от агента, проверяем текущий статус в БД
      if (!deploymentCompleted) {
        const currentDeployment =
          await this.deploymentRepository.findById(deploymentId);
        if (
          currentDeployment &&
          currentDeployment.status !==
            deploymentStatusToDbString(
              DeploymentStatus.DEPLOYMENT_STATUS_SUCCESS
            )
        ) {
          // Если статус все еще IN_PROGRESS, оставляем его таким (возможно, деплой еще идет)
          this.logger.warn(
            `Deployment ${deploymentId} status check timeout. Current status: ${currentDeployment.status}`
          );
        } else {
          // Если статус уже SUCCESS, считаем деплой завершенным
          deploymentCompleted = true;
        }
      }

      // Если деплой не завершился за отведенное время, обновляем статус
      if (!deploymentCompleted) {
        await this.deploymentRepository.update(deploymentId, {
          status: deploymentStatusToDbString(
            DeploymentStatus.DEPLOYMENT_STATUS_FAILED
          ),
          completedAt: new Date(),
        });
        throw new Error(
          `Deployment ${deploymentId} did not complete within timeout period`
        );
      }

      this.logger.log(
        `Deployment ${deploymentId} completed successfully (job ${job.id})`
      );
    } catch (error) {
      this.logger.error(
        `Failed to process deployment ${deploymentId} (job ${job.id})`,
        error
      );

      // Обновляем статус на FAILED
      try {
        await this.deploymentRepository.update(deploymentId, {
          status: deploymentStatusToDbString(
            DeploymentStatus.DEPLOYMENT_STATUS_FAILED
          ),
          completedAt: new Date(),
        });
      } catch (updateError) {
        this.logger.error(
          `Failed to update deployment status to FAILED for ${deploymentId}`,
          updateError
        );
      }

      // Логируем ошибку и пробрасываем для retry logic BullMQ
      this.logger.error(
        `Failed to process deployment job ${job.id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
      // Пробрасываем оригинальную ошибку для retry logic BullMQ
      throw error;
    }
  }
}
