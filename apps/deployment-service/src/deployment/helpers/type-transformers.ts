/**
 * Type transformers for converting DB types to contract types
 */

import {
  mapDeploymentStatus,
  type Deployment as ContractDeployment,
  type ServiceDeploymentStatus as ContractServiceDeploymentStatus,
  type DeploymentConfig as ContractDeploymentConfig,
} from "@axion/contracts";

import type { Deployment as DbDeployment } from "@/database/schema";

/**
 * Transform database ServiceDeploymentStatus to Protobuf ServiceDeploymentStatus
 */
function transformServiceDeploymentStatus(
  dbStatus: NonNullable<DbDeployment["serviceStatuses"]>[number]
): ContractServiceDeploymentStatus {
  return {
    serviceId: dbStatus.serviceId,
    nodeId: dbStatus.nodeId,
    serviceName: dbStatus.serviceName,
    status: mapDeploymentStatus(dbStatus.status),
    serverId: dbStatus.serverId || "",
    errorMessage: dbStatus.errorMessage || "",
    deployedAt: dbStatus.deployedAt || 0,
  };
}

/**
 * Transform database DeploymentConfig to Protobuf DeploymentConfig
 */
function transformDeploymentConfig(
  dbConfig: DbDeployment["config"]
): ContractDeploymentConfig | undefined {
  if (!dbConfig) {
    return undefined;
  }

  return {
    dockerComposeYml: dbConfig.dockerComposeYml || "",
    dockerfiles: dbConfig.dockerfiles || {},
    dockerImages: dbConfig.dockerImages || {},
    serviceDependencies: dbConfig.serviceDependencies || [],
  } as ContractDeploymentConfig;
}

/**
 * Transform database Deployment to Protobuf Deployment
 */
export function transformDeploymentToContract(
  dbDeployment: DbDeployment
): ContractDeployment {
  return {
    id: dbDeployment.id,
    projectId: dbDeployment.projectId,
    clusterId: dbDeployment.clusterId || undefined,
    serverId: dbDeployment.serverId || undefined,
    status: mapDeploymentStatus(dbDeployment.status),
    serviceStatuses:
      dbDeployment.serviceStatuses?.map(transformServiceDeploymentStatus) || [],
    envVars: dbDeployment.envVars || {},
    config: transformDeploymentConfig(dbDeployment.config),
    startedAt: dbDeployment.startedAt?.getTime() || 0,
    completedAt: dbDeployment.completedAt?.getTime() || 0,
    createdAt: dbDeployment.createdAt.getTime(),
    updatedAt: dbDeployment.updatedAt.getTime(),
  };
}
