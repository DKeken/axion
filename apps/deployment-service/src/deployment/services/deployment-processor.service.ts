import { DeploymentStatus, deploymentStatusToDbString } from "@axion/contracts";
import { DeployProjectCommand } from "@axion/contracts/generated/runner-agent/deployment";
import { QUEUE_NAMES } from "@axion/nestjs-common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { mapRunnerServiceStatusesToDb } from "@/deployment/helpers/deployment-status.mapper";
import { type DeploymentRepository } from "@/deployment/repositories/deployment.repository";
import { RunnerAgentService } from "@/deployment/services/runner-agent.service";
import type { DeploymentJobPayload } from "@/deployment/services/types";

/**
 * Deployment Processor
 * Обрабатывает задачи деплоя из очереди BullMQ
 */
@Processor(QUEUE_NAMES.DEPLOYMENT)
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

      // Tracking: if Runner Agent status API is not implemented (stub), do not fail.
      const initialStatusProbe =
        await this.runnerAgentService.getDeploymentStatus(
          agentId,
          deploymentId
        );
      if (!initialStatusProbe) {
        this.logger.warn(
          `Runner Agent status not available; skipping polling for deployment ${deploymentId}`
        );
        return;
      }

      const deadlineAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      let delayMs = 2000;
      const maxDelayMs = 15000;
      let attempt = 0;

      // Poll until final status or timeout.
      while (Date.now() < deadlineAt) {
        // Cancel support: if deployment already marked completed/failed, stop gracefully.
        const currentDeployment =
          await this.deploymentRepository.findById(deploymentId);
        if (!currentDeployment) return;

        if (
          currentDeployment.status ===
            deploymentStatusToDbString(
              DeploymentStatus.DEPLOYMENT_STATUS_FAILED
            ) &&
          currentDeployment.completedAt
        ) {
          this.logger.log(
            `Deployment ${deploymentId} already completed as FAILED; stopping polling`
          );
          return;
        }

        try {
          const statusResponse =
            await this.runnerAgentService.getDeploymentStatus(
              agentId,
              deploymentId
            );

          if (!statusResponse) {
            // No data - backoff and retry
          } else {
            const {
              status: agentStatus,
              serviceStatuses,
              progressPercent,
            } = statusResponse;

            if (typeof progressPercent === "number") {
              await job.updateProgress(progressPercent);
            }

            if (serviceStatuses && serviceStatuses.length > 0) {
              await this.deploymentRepository.update(deploymentId, {
                serviceStatuses: mapRunnerServiceStatusesToDb(serviceStatuses),
              });
            }

            if (
              agentStatus === DeploymentStatus.DEPLOYMENT_STATUS_SUCCESS ||
              agentStatus === DeploymentStatus.DEPLOYMENT_STATUS_FAILED
            ) {
              await this.deploymentRepository.update(deploymentId, {
                status: deploymentStatusToDbString(agentStatus),
                completedAt: new Date(),
              });
              if (agentStatus === DeploymentStatus.DEPLOYMENT_STATUS_SUCCESS) {
                await job.updateProgress(100);
              }
              this.logger.log(
                `Deployment ${deploymentId} completed with status ${agentStatus}`
              );
              return;
            }
          }
        } catch (statusError) {
          this.logger.warn(
            `Failed to get deployment status (attempt ${attempt}): ${statusError instanceof Error ? statusError.message : String(statusError)}`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        attempt += 1;
        delayMs = Math.min(Math.round(delayMs * 1.5), maxDelayMs);
      }

      // Timeout: keep deployment in progress (agent may still be deploying).
      this.logger.warn(
        `Deployment ${deploymentId} status polling timed out; leaving status as-is`
      );

      this.logger.log(
        `Deployment ${deploymentId} polling finished without final status (job ${job.id})`
      );
    } catch (error) {
      this.logger.error(
        `Failed to process deployment job ${job.id} for deployment ${deploymentId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
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

      // Пробрасываем оригинальную ошибку для retry logic BullMQ
      throw error;
    }
  }
}
