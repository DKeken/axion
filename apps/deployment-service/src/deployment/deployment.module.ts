import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { DeploymentController } from "@/deployment/deployment.controller";
import { DeploymentService } from "@/deployment/deployment.service";
import { DeploymentHistoryRepository } from "@/deployment/repositories/deployment-history.repository";
import { DeploymentRepository } from "@/deployment/repositories/deployment.repository";
import { DatabaseServiceGeneratorService } from "@/deployment/services/database-service-generator.service";
import { DependencyResolverService } from "@/deployment/services/dependency-resolver.service";
import { DockerfileGeneratorService } from "@/deployment/services/dockerfile-generator.service";
import { DockerStackGenerationService } from "@/deployment/services/docker-stack-generation.service";
import { QueueService } from "@/deployment/services/queue.service";
import { RunnerAgentService } from "@/deployment/services/runner-agent.service";
import { ServiceComposeGeneratorService } from "@/deployment/services/service-compose-generator.service";
import { DeploymentsService } from "@/deployment/services/deployments.service";
import { DeploymentProcessor } from "@/deployment/services/deployment-processor.service";
import { AgentInstallationService } from "@/deployment/services/agent-installation.service";
import { AgentInstallationProcessor } from "@/deployment/services/agent-installation-processor.service";

@Module({
  imports: [
    // Регистрируем очереди в этом модуле
    BullModule.registerQueue({
      name: "deployment-queue",
    }),
    BullModule.registerQueue({
      name: "agent-installation-queue",
    }),
  ],
  controllers: [DeploymentController],
  providers: [
    // Main coordinator
    DeploymentService,
    DeploymentsService,
    // Docker stack generation (coordinator + specialized services)
    DockerStackGenerationService,
    DependencyResolverService,
    DatabaseServiceGeneratorService,
    ServiceComposeGeneratorService,
    DockerfileGeneratorService,
    // Queue and Runner Agent
    QueueService,
    RunnerAgentService,
    // Agent Installation
    AgentInstallationService,
    // BullMQ Processors
    DeploymentProcessor,
    AgentInstallationProcessor,
    // Repositories
    DeploymentRepository,
    DeploymentHistoryRepository,
  ],
})
export class DeploymentModule {}
