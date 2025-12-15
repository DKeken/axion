import type {
  DeploymentConfig,
  DeployProjectRequest,
  InstallAgentRequest,
} from "@axion/contracts";
import { QueueOptions } from "@axion/nestjs-common";

export type DeploymentJobPayload = {
  deploymentId: string;
  projectId: string;
  clusterId?: string;
  serverId?: string;
  config: DeploymentConfig;
  envVars: DeployProjectRequest["envVars"];
};

/**
 * Payload для задачи установки агента в очереди BullMQ
 * Использует типы из контрактов
 */
export type AgentInstallationJobPayload = {
  serverId: string;
  metadata: InstallAgentRequest["metadata"];
};

// Re-export для обратной совместимости
export type { QueueOptions };

/**
 * Результат генерации Docker Compose
 */
export type DockerComposeResult = {
  dockerComposeYml: string;
  serviceDependencies: string[];
};

/**
 * Re-export compose types from schemas
 */
export type {
  ServiceComposeConfig,
  DatabaseServiceConfig,
  ComposeService,
  ComposeSpec,
} from "@/deployment/schemas/compose.schema";
