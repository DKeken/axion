/**
 * Internal types for deployment services
 * Используются только внутри deployment-service
 * Все публичные типы должны быть из @axion/contracts
 */

import type {
  DeploymentConfig,
  DeployProjectRequest,
  InstallAgentRequest,
} from "@axion/contracts";

/**
 * Payload для задачи деплоя в очереди BullMQ
 * Использует типы из контрактов
 */
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

/**
 * Опции для очереди BullMQ
 */
export type QueueOptions = {
  attempts: number;
  backoff: {
    type: "exponential" | "fixed";
    delay: number;
  };
  removeOnComplete: boolean;
  removeOnFail: boolean;
};

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
