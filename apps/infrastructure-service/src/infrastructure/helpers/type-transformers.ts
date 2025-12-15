/**
 * Type transformers for converting DB types to contract types
 */

import {
  mapServerStatus,
  type Server as ContractServer,
  type ServerInfo as ContractServerInfo,
  type Cluster as ContractCluster,
} from "@axion/contracts";

import type {
  Server as DbServer,
  Cluster as DbCluster,
} from "@/database/schema";

/**
 * Transform database Server to Protobuf Server
 */
export function transformServerToContract(dbServer: DbServer): ContractServer {
  return {
    id: dbServer.id,
    userId: dbServer.userId,
    clusterId: dbServer.clusterId || undefined,
    host: dbServer.host,
    port: dbServer.port,
    username: dbServer.username,
    name: dbServer.name,
    description: dbServer.description || "",
    status: mapServerStatus(dbServer.status),
    info: transformServerInfo(dbServer.serverInfo),
    agentId: dbServer.agentId || undefined,
    lastConnectedAt: dbServer.lastConnectedAt
      ? dbServer.lastConnectedAt.getTime()
      : 0,
    createdAt: dbServer.createdAt.getTime(),
    updatedAt: dbServer.updatedAt.getTime(),
  };
}

/**
 * Transform database ServerInfo to Protobuf ServerInfo
 */
function transformServerInfo(
  serverInfo: DbServer["serverInfo"]
): ContractServerInfo {
  if (!serverInfo) {
    return {
      os: "",
      architecture: "",
      totalMemory: 0,
      availableMemory: 0,
      cpuCores: 0,
      cpuUsage: 0,
      dockerInstalled: false,
      dockerVersion: "",
    };
  }

  return {
    os: serverInfo.os || "",
    architecture: serverInfo.architecture || "",
    totalMemory: serverInfo.totalMemory || 0,
    availableMemory: serverInfo.availableMemory || 0,
    cpuCores: serverInfo.cpuCores || 0,
    cpuUsage: serverInfo.cpuUsage || 0,
    dockerInstalled: serverInfo.dockerInstalled || false,
    dockerVersion: serverInfo.dockerVersion || "",
  };
}

/**
 * Transform database Cluster to Protobuf Cluster
 */
export function transformClusterToContract(
  dbCluster: DbCluster,
  serversCount: number
): ContractCluster {
  return {
    id: dbCluster.id,
    userId: dbCluster.userId,
    name: dbCluster.name,
    description: dbCluster.description || "",
    serversCount,
    createdAt: dbCluster.createdAt.getTime(),
    updatedAt: dbCluster.updatedAt.getTime(),
  };
}
