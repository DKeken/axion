/**
 * Helper functions for creating Infrastructure Service responses according to Protobuf contracts
 * These functions create responses with the correct structure matching the generated types
 */

import { Status } from "../../generated/common/common";
import type {
  Server,
  ServerResponse,
  ListServersResponse,
  ListServersData,
  TestServerConnectionResponse,
  ServerConnectionTestResult,
} from "../../generated/infrastructure/servers";
import type {
  Cluster,
  ClusterResponse,
  ListClustersResponse,
  ListClustersData,
} from "../../generated/infrastructure/clusters";
import type {
  InstallAgentResponse,
  AgentInstallationResult,
  AgentStatusResponse,
  AgentStatus,
} from "../../generated/infrastructure/agents";
import type {
  ConfigureServerResponse,
  ServerConfigurationResult,
  CalculateSystemRequirementsResponse,
  SystemRequirementsEstimation,
} from "../../generated/infrastructure/servers";
import type { Pagination } from "../../generated/common/common";

/**
 * Create ServerResponse with correct structure: { status, error?, server? }
 */
export function createServerResponse(server?: Server): ServerResponse {
  return {
    status: Status.STATUS_SUCCESS,
    server,
  };
}

/**
 * Create ListServersResponse with correct structure: { status, error?, data?: { servers, pagination } }
 */
export function createListServersResponse(
  servers: Server[],
  pagination?: Pagination
): ListServersResponse {
  const data: ListServersData = {
    servers,
    pagination: pagination || {
      page: 1,
      limit: 10,
      total: servers.length,
      totalPages: 1,
    },
  };

  return {
    status: Status.STATUS_SUCCESS,
    data,
  };
}

/**
 * Create ClusterResponse with correct structure: { status, error?, cluster? }
 */
export function createClusterResponse(cluster?: Cluster): ClusterResponse {
  return {
    status: Status.STATUS_SUCCESS,
    cluster,
  };
}

/**
 * Create ListClustersResponse with correct structure: { status, error?, data?: { clusters, pagination } }
 */
export function createListClustersResponse(
  clusters: Cluster[],
  pagination?: Pagination
): ListClustersResponse {
  const data: ListClustersData = {
    clusters,
    pagination: pagination || {
      page: 1,
      limit: 10,
      total: clusters.length,
      totalPages: 1,
    },
  };

  return {
    status: Status.STATUS_SUCCESS,
    data,
  };
}

/**
 * Create TestServerConnectionResponse with correct structure
 */
export function createTestServerConnectionResponse(
  result: ServerConnectionTestResult
): TestServerConnectionResponse {
  return {
    status: Status.STATUS_SUCCESS,
    data: result,
  };
}

/**
 * Create InstallAgentResponse with correct structure: { status, error? | data? }
 */
export function createInstallAgentResponse(
  result: AgentInstallationResult
): InstallAgentResponse {
  return {
    status: Status.STATUS_SUCCESS,
    data: result,
  };
}

/**
 * Create AgentStatusResponse with correct structure: { status, error? | agentStatus? }
 */
export function createAgentStatusResponse(
  agentStatus: AgentStatus
): AgentStatusResponse {
  return {
    status: Status.STATUS_SUCCESS,
    agentStatus,
  };
}

/**
 * Create ConfigureServerResponse with correct structure: { status, error? | data? }
 */
export function createConfigureServerResponse(
  result: ServerConfigurationResult
): ConfigureServerResponse {
  return {
    status: Status.STATUS_SUCCESS,
    data: result,
  };
}

/**
 * Create CalculateSystemRequirementsResponse with correct structure: { status, error? | data? }
 */
export function createCalculateSystemRequirementsResponse(
  data: SystemRequirementsEstimation
): CalculateSystemRequirementsResponse {
  return {
    status: Status.STATUS_SUCCESS,
    data,
  };
}
