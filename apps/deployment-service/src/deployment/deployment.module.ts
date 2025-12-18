import { QUEUE_NAMES } from "@axion/nestjs-common";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { DeploymentHttpController } from "@/deployment/controllers/deployment-http.controller";
import { DeploymentController } from "@/deployment/deployment.controller";
import { DeploymentService } from "@/deployment/deployment.service";
import { DeploymentHistoryRepository } from "@/deployment/repositories/deployment-history.repository";
import { DeploymentRepository } from "@/deployment/repositories/deployment.repository";
import { AgentInstallationProcessor } from "@/deployment/services/agent-installation-processor.service";
import { AgentInstallationService } from "@/deployment/services/agent-installation.service";
import { DeploymentProcessor } from "@/deployment/services/deployment-processor.service";
import { DeploymentQueueEventsService } from "@/deployment/services/deployment-queue-events.service";
import { DeploymentsService } from "@/deployment/services/deployments.service";
import { DockerStackGenerationService } from "@/deployment/services/docker-stack-generation.service";
import { QueueService } from "@/deployment/services/queue.service";
import { RunnerAgentService } from "@/deployment/services/runner-agent.service";

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.DEPLOYMENT,
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.AGENT_INSTALLATION,
    }),
  ],
  controllers: [DeploymentController, DeploymentHttpController],
  providers: [
    DeploymentService,
    DeploymentsService,
    DockerStackGenerationService,
    QueueService,
    RunnerAgentService,
    AgentInstallationService,
    DeploymentProcessor,
    AgentInstallationProcessor,
    DeploymentQueueEventsService,
    DeploymentRepository,
    DeploymentHistoryRepository,
  ],
})
export class DeploymentModule {}
