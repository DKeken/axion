import {
  createFullPagination,
  createDeployProjectResponse,
  createDeploymentResponse,
  createListDeploymentsResponse,
  createDeploymentStatusResponse,
  createRollbackDeploymentResponse,
  DeploymentStatus,
  deploymentStatusToDbString,
  CODEGEN_SERVICE_NAME,
  CODEGEN_SERVICE_PATTERNS,
  INFRASTRUCTURE_SERVICE_NAME,
  INFRASTRUCTURE_SERVICE_PATTERNS,
  type GenerateProjectRequest,
  type GetServerRequest,
  type GetClusterRequest,
  type DeployProjectRequest,
  type CancelDeploymentRequest,
  type GetDeploymentRequest,
  type ListDeploymentsRequest,
  type GetDeploymentStatusRequest,
  type RollbackDeploymentRequest,
  type DeploymentStatusData,
  type GenerateProjectResponse,
  type ServerResponse,
  type ClusterResponse,
} from "@axion/contracts";
import {
  createErrorResponse,
  createNotFoundError,
  createValidationError,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService, enforceLimit, handleServiceError } from "@axion/shared";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

import { env } from "@/config/env";
import { generateDockerfile } from "@/deployment/generation/dockerfile-generator";
import { verifyDeploymentAccess } from "@/deployment/helpers/deployment-access.helper";
import { transformDeploymentToContract } from "@/deployment/helpers/type-transformers";
import { type DeploymentHistoryRepository } from "@/deployment/repositories/deployment-history.repository";
import { type DeploymentRepository } from "@/deployment/repositories/deployment.repository";
import { DockerStackGenerationService } from "@/deployment/services/docker-stack-generation.service";
import { QueueService } from "@/deployment/services/queue.service";
import { RunnerAgentService } from "@/deployment/services/runner-agent.service";

@Injectable()
export class DeploymentsService extends BaseService {
  constructor(
    private readonly deploymentRepository: DeploymentRepository,
    private readonly deploymentHistoryRepository: DeploymentHistoryRepository,
    private readonly dockerStackGenerationService: DockerStackGenerationService,
    private readonly queueService: QueueService,
    private readonly runnerAgentService: RunnerAgentService,
    @Optional()
    @Inject(INFRASTRUCTURE_SERVICE_NAME)
    private readonly infrastructureClient: ClientProxy | null,
    @Optional()
    @Inject(CODEGEN_SERVICE_NAME)
    private readonly codegenClient: ClientProxy | null
  ) {
    super(DeploymentsService.name);
  }

  @CatchError({ operation: "deploying project" })
  async deployProject(data: DeployProjectRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    // Валидация
    if (!data.projectId) {
      return this.createValidationResponse("project_id is required");
    }

    if (!data.clusterId && !data.serverId) {
      return this.createValidationResponse(
        "either cluster_id or server_id is required"
      );
    }

    const deploymentsCount = await this.deploymentRepository.countByProjectId(
      data.projectId
    );
    const limitCheck = enforceLimit(
      "deployments",
      deploymentsCount,
      env.maxDeploymentsPerProject
    );
    if (!limitCheck.success) return limitCheck.response;

    // Проверка доступности клиентов
    if (!this.infrastructureClient) {
      return createErrorResponse(
        createValidationError("Infrastructure service client not available")
      );
    }

    if (!this.codegenClient) {
      return createErrorResponse(
        createValidationError("Codegen service client not available")
      );
    }

    // Проверка существования сервера/кластера через Infrastructure Service
    try {
      if (data.serverId) {
        const req: GetServerRequest = {
          metadata: data.metadata,
          serverId: data.serverId,
        };
        const serverResponse = (await firstValueFrom(
          this.infrastructureClient.send(
            INFRASTRUCTURE_SERVICE_PATTERNS.GET_SERVER,
            req
          )
        )) as ServerResponse;

        if (serverResponse.error) {
          return createErrorResponse(serverResponse.error);
        }

        if (!serverResponse.server) {
          return createErrorResponse(
            createNotFoundError("Server", data.serverId)
          );
        }
      } else if (data.clusterId) {
        const req: GetClusterRequest = {
          metadata: data.metadata,
          clusterId: data.clusterId,
        };
        const clusterResponse = (await firstValueFrom(
          this.infrastructureClient.send(
            INFRASTRUCTURE_SERVICE_PATTERNS.GET_CLUSTER,
            req
          )
        )) as ClusterResponse;

        if (clusterResponse.error) {
          return createErrorResponse(clusterResponse.error);
        }

        if (!clusterResponse.cluster) {
          return createErrorResponse(
            createNotFoundError("Cluster", data.clusterId)
          );
        }
      }
    } catch (error) {
      return handleServiceError(
        this.logger,
        "checking server/cluster in infrastructure-service",
        error
      );
    }

    // Получение сгенерированного кода из Codegen Service
    let _generatedCode: GenerateProjectResponse | undefined;
    try {
      const req: GenerateProjectRequest = {
        metadata: data.metadata,
        projectId: data.projectId,
        aiModel: "",
        forceRegenerate: false,
      };
      const codegenResponse = await firstValueFrom<GenerateProjectResponse>(
        this.codegenClient.send(CODEGEN_SERVICE_PATTERNS.GENERATE_PROJECT, req)
      );

      if (codegenResponse.error) {
        return createErrorResponse(codegenResponse.error);
      }

      _generatedCode = codegenResponse;
    } catch (error) {
      return handleServiceError(
        this.logger,
        "generating code from codegen-service",
        error
      );
    }

    // Генерируем Docker Compose и Dockerfile на основе сгенерированного кода
    let dockerComposeYml = "";
    let serviceDependencies: string[] = [];
    const dockerfiles: Record<string, string> = {};

    if (!_generatedCode?.data?.results?.length) {
      return this.createValidationResponse(
        "Generated code is empty. Please regenerate the project before deploy."
      );
    }

    if (_generatedCode.data.results) {
      try {
        const dockerStack =
          await this.dockerStackGenerationService.generateDockerCompose(
            data.projectId,
            data.metadata,
            _generatedCode.data.results,
            data.envVars || {}
          );
        dockerComposeYml = dockerStack.dockerComposeYml;
        serviceDependencies = dockerStack.serviceDependencies;

        // Генерируем Dockerfile для каждого сервиса
        for (const result of _generatedCode.data.results) {
          if (result.generatedCodePath) {
            dockerfiles[result.serviceName] = generateDockerfile(
              result.serviceName,
              result.generatedCodePath
            );
          }
        }
      } catch (error) {
        return handleServiceError(
          this.logger,
          "generating Docker Compose and Dockerfiles",
          error
        );
      }
    }

    // Создаем запись деплоя с конфигурацией
    let deployment = await this.deploymentRepository.create({
      projectId: data.projectId,
      clusterId: data.clusterId || null,
      serverId: data.serverId || null,
      status: deploymentStatusToDbString(
        DeploymentStatus.DEPLOYMENT_STATUS_PENDING
      ),
      envVars: data.envVars || {},
      serviceStatuses: null,
      config: {
        dockerComposeYml,
        dockerfiles,
        dockerImages: {},
        serviceDependencies,
      },
    });

    // Создаем задачу в BullMQ очереди
    let jobId: string | undefined;
    try {
      jobId = await this.queueService.createDeploymentJob(deployment.id, {
        projectId: data.projectId,
        clusterId: data.clusterId,
        serverId: data.serverId,
        config: {
          dockerComposeYml,
          dockerfiles,
          dockerImages: {},
          serviceDependencies,
        },
        envVars: data.envVars || {},
      });
      this.logger.log(
        `Created deployment job ${jobId} for deployment ${deployment.id}`
      );

      // Сохраняем jobId в deployment
      if (jobId) {
        await this.deploymentRepository.update(deployment.id, {
          jobId,
        });
        // Обновляем локальную переменную для последующего использования
        const updatedDeployment = await this.deploymentRepository.findById(
          deployment.id
        );
        if (!updatedDeployment) {
          throw new Error("Deployment not found after update");
        }
        deployment = updatedDeployment;
      }
    } catch (error) {
      this.logger.warn("Failed to create deployment job in queue", error);
      // Не прерываем процесс, так как очередь может быть еще не настроена
    }

    // Сохраняем в историю для rollback
    await this.deploymentHistoryRepository.create({
      deploymentId: deployment.id,
      deploymentSnapshot: {
        id: deployment.id,
        projectId: deployment.projectId,
        clusterId: deployment.clusterId || undefined,
        serverId: deployment.serverId || undefined,
        status: deployment.status,
        serviceStatuses: deployment.serviceStatuses || null,
        envVars: deployment.envVars || null,
        config: deployment.config || null,
        jobId: deployment.jobId ?? null,
        startedAt: deployment.startedAt || undefined,
        completedAt: deployment.completedAt || undefined,
      },
      version: deployment.createdAt.toISOString(),
      rolledBack: false,
    });

    return createDeployProjectResponse(
      transformDeploymentToContract(deployment)
    );
  }

  @CatchError({ operation: "canceling deployment" })
  async cancelDeployment(data: CancelDeploymentRequest) {
    const access = await verifyDeploymentAccess(
      this.deploymentRepository,
      data.deploymentId,
      data.metadata
    );
    if (!access.success) return access.response;

    // Получаем deployment для получения jobId и agentId
    const deployment = await this.deploymentRepository.findById(
      data.deploymentId
    );
    if (!deployment) {
      return this.createNotFoundResponse("Deployment", data.deploymentId);
    }

    // Отменяем задачу в BullMQ очереди
    if (deployment.jobId) {
      try {
        await this.queueService.cancelDeploymentJob(deployment.jobId);
        this.logger.log(
          `Canceled deployment job ${deployment.jobId} for deployment ${data.deploymentId}`
        );
      } catch (error) {
        this.logger.warn(
          `Failed to cancel deployment job ${deployment.jobId} in queue`,
          error
        );
      }
    }

    // Отправляем команду отмены в Runner Agent
    const agentId = deployment.serverId || deployment.clusterId;
    if (agentId) {
      try {
        await this.runnerAgentService.cancelDeployment(
          agentId,
          data.deploymentId
        );
      } catch (error) {
        this.logger.warn(
          "Failed to send cancel command to Runner Agent",
          error
        );
      }
    }

    const updated = await this.deploymentRepository.update(data.deploymentId, {
      status: deploymentStatusToDbString(
        DeploymentStatus.DEPLOYMENT_STATUS_FAILED
      ),
      completedAt: new Date(),
    });

    if (!updated) {
      return this.createNotFoundResponse("Deployment", data.deploymentId);
    }

    return { status: 1 }; // STATUS_SUCCESS
  }

  @CatchError({ operation: "getting deployment" })
  async get(data: GetDeploymentRequest) {
    const access = await verifyDeploymentAccess(
      this.deploymentRepository,
      data.deploymentId,
      data.metadata
    );
    if (!access.success) return access.response;

    const deployment = await this.deploymentRepository.findById(
      data.deploymentId
    );
    if (!deployment) {
      return this.createNotFoundResponse("Deployment", data.deploymentId);
    }

    return createDeploymentResponse(transformDeploymentToContract(deployment));
  }

  @CatchError({ operation: "listing deployments" })
  async list(data: ListDeploymentsRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    const { page, limit } = this.extractPagination(data.pagination);

    const statusFilter = data.statusFilter
      ? deploymentStatusToDbString(data.statusFilter)
      : undefined;

    const result = await this.deploymentRepository.findByProjectId(
      data.projectId,
      page,
      limit,
      statusFilter
    );

    return createListDeploymentsResponse(
      result.deployments.map(transformDeploymentToContract),
      createFullPagination({ page, limit }, result.total)
    );
  }

  @CatchError({ operation: "getting deployment status" })
  async getStatus(data: GetDeploymentStatusRequest) {
    const access = await verifyDeploymentAccess(
      this.deploymentRepository,
      data.deploymentId,
      data.metadata
    );
    if (!access.success) return access.response;

    const deployment = await this.deploymentRepository.findById(
      data.deploymentId
    );
    if (!deployment) {
      return this.createNotFoundResponse("Deployment", data.deploymentId);
    }

    // Пытаемся получить реальный статус от Runner Agent
    const agentId = deployment.serverId || deployment.clusterId || "";
    let runnerStatus = null;
    if (agentId) {
      try {
        runnerStatus = await this.runnerAgentService.getDeploymentStatus(
          agentId,
          data.deploymentId
        );
      } catch (error) {
        this.logger.warn(
          "Failed to get deployment status from Runner Agent",
          error
        );
      }
    }

    // Используем статус от Runner Agent если доступен, иначе из БД
    // Преобразуем ServiceDeploymentStatus из runner-agent в формат deployment
    const deploymentContract = transformDeploymentToContract(deployment);
    const statusData: DeploymentStatusData = runnerStatus?.data
      ? {
          status: runnerStatus.data.status,
          serviceStatuses:
            runnerStatus.data.serviceStatuses?.map((s) => ({
              serviceId: s.serviceId,
              nodeId: s.serviceId, // Используем serviceId как nodeId
              serviceName: s.serviceName,
              status: s.status,
              serverId: "", // Runner Agent не предоставляет serverId
              errorMessage: s.errorMessage || "",
              deployedAt: s.deployedAt || 0,
            })) || [],
          currentStage: runnerStatus.data.currentStage || 0,
          progressPercent: runnerStatus.data.progressPercent || 0,
          errorMessage: runnerStatus.data.errorMessage || "",
        }
      : {
          status: deploymentContract.status,
          serviceStatuses: deploymentContract.serviceStatuses,
          currentStage: 0, // DEPLOYMENT_STAGE_UNSPECIFIED
          progressPercent: 0,
          errorMessage: "",
        };

    return createDeploymentStatusResponse(statusData);
  }

  @CatchError({ operation: "rolling back deployment" })
  async rollback(data: RollbackDeploymentRequest) {
    const access = await verifyDeploymentAccess(
      this.deploymentRepository,
      data.deploymentId,
      data.metadata
    );
    if (!access.success) return access.response;

    // Находим версию для отката
    let historyEntry;
    if (data.targetDeploymentId) {
      // Откат к конкретному деплою
      const targetDeployment = await this.deploymentRepository.findById(
        data.targetDeploymentId
      );
      if (!targetDeployment) {
        return this.createNotFoundResponse(
          "Target Deployment",
          data.targetDeploymentId
        );
      }
      // Создаем snapshot из target deployment
      historyEntry = {
        deploymentSnapshot: {
          id: targetDeployment.id,
          projectId: targetDeployment.projectId,
          clusterId: targetDeployment.clusterId || undefined,
          serverId: targetDeployment.serverId || undefined,
          status: targetDeployment.status,
          serviceStatuses: targetDeployment.serviceStatuses || undefined,
          envVars: targetDeployment.envVars || undefined,
          config: targetDeployment.config || undefined,
          startedAt: targetDeployment.startedAt || undefined,
          completedAt: targetDeployment.completedAt || undefined,
        },
        version: targetDeployment.createdAt.toISOString(),
      };
    } else {
      // Откат к предыдущему деплою
      historyEntry =
        await this.deploymentHistoryRepository.findLatestByDeploymentId(
          data.deploymentId
        );
      if (!historyEntry) {
        return this.createValidationResponse(
          "No previous deployment found for rollback"
        );
      }
    }

    // Создаем новый деплой на основе snapshot
    if (!historyEntry.deploymentSnapshot) {
      return this.createValidationResponse(
        "Deployment snapshot is missing in history entry"
      );
    }

    const snapshot = historyEntry.deploymentSnapshot;
    const newDeployment = await this.deploymentRepository.create({
      projectId: snapshot.projectId,
      clusterId: snapshot.clusterId || null,
      serverId: snapshot.serverId || null,
      status: deploymentStatusToDbString(
        DeploymentStatus.DEPLOYMENT_STATUS_PENDING
      ),
      envVars: snapshot.envVars || {},
      serviceStatuses: snapshot.serviceStatuses || [],
      config: snapshot.config || null,
    });

    // Отправляем команду rollback в Runner Agent
    const agentId = snapshot.serverId || snapshot.clusterId || "";
    if (agentId) {
      try {
        await this.runnerAgentService.rollbackDeployment(
          agentId,
          data.deploymentId,
          newDeployment.id
        );
      } catch (error) {
        this.logger.warn(
          "Failed to send rollback command to Runner Agent",
          error
        );
      }
    }

    // Обновляем статус текущего деплоя
    const updated = await this.deploymentRepository.update(data.deploymentId, {
      status: deploymentStatusToDbString(
        DeploymentStatus.DEPLOYMENT_STATUS_ROLLING_BACK
      ),
    });

    if (!updated) {
      return this.createNotFoundResponse("Deployment", data.deploymentId);
    }

    // Помечаем историю как откаченную
    if (historyEntry && "id" in historyEntry) {
      await this.deploymentHistoryRepository.update(historyEntry.id, {
        rolledBack: true,
      });
    }

    return createRollbackDeploymentResponse(
      transformDeploymentToContract(updated)
    );
  }
}
