/**
 * Infrastructure API domain - Servers, Clusters, and Agents
 */

import type {
  AgentStatusResponse,
  CalculateSystemRequirementsRequest,
  CalculateSystemRequirementsResponse,
  ClusterResponse,
  ConfigureServerRequest,
  ConfigureServerResponse,
  CreateClusterRequest,
  CreateServerRequest,
  InstallAgentRequest,
  InstallAgentResponse,
  ListClustersResponse,
  ListServersResponse,
  ServerResponse,
  TestServerConnectionRequest,
  TestServerConnectionResponse,
  UpdateClusterRequest,
  UpdateServerRequest,
} from "@axion/contracts";
import type { PaginationQuery } from "@axion/nestjs-common";

import type { HttpClient } from "../http-client";
import { defineQuery, type AxionQueryOptions } from "../query-options";
import type {
  OmitMetadata,
  OmitMetadataAndFields,
  RequestOptions,
} from "../types";

import { API_BASE_PATH, STALE_TIME_LONG, STALE_TIME_STANDARD, STALE_TIME_MEDIUM, STALE_TIME_VERY_LONG } from "../constants";

/**
 * Query keys factory for infrastructure domain
 */
export const infrastructureKeys = {
  all: () => ["infrastructure"] as const,

  // Servers
  servers: {
    all: () => [...infrastructureKeys.all(), "servers"] as const,
    lists: () => [...infrastructureKeys.servers.all(), "list"] as const,
    list: (params?: { clusterId?: string } & PaginationQuery) =>
      [...infrastructureKeys.servers.lists(), params ?? {}] as const,
    details: () => [...infrastructureKeys.servers.all(), "detail"] as const,
    detail: (serverId: string) =>
      [...infrastructureKeys.servers.details(), serverId] as const,
  },

  // Clusters
  clusters: {
    all: () => [...infrastructureKeys.all(), "clusters"] as const,
    lists: () => [...infrastructureKeys.clusters.all(), "list"] as const,
    list: (params?: PaginationQuery) =>
      [...infrastructureKeys.clusters.lists(), params ?? {}] as const,
    details: () => [...infrastructureKeys.clusters.all(), "detail"] as const,
    detail: (clusterId: string) =>
      [...infrastructureKeys.clusters.details(), clusterId] as const,
    servers: (clusterId: string) =>
      [...infrastructureKeys.clusters.detail(clusterId), "servers"] as const,
  },

  // Agents
  agents: {
    all: () => [...infrastructureKeys.all(), "agents"] as const,
    status: (serverId: string) =>
      [...infrastructureKeys.agents.all(), "status", serverId] as const,
  },

  // System requirements
  systemRequirements: {
    all: () => [...infrastructureKeys.all(), "system-requirements"] as const,
    calculate: (data: OmitMetadata<CalculateSystemRequirementsRequest>) =>
      [
        ...infrastructureKeys.systemRequirements.all(),
        "calculate",
        data,
      ] as const,
  },
} as const;

/**
 * Infrastructure API client
 */
export function createInfrastructureApi(client: HttpClient) {
  return {
    // Servers
    listServers: (
      params?: { clusterId?: string } & PaginationQuery,
      options?: RequestOptions
    ) =>
      client.get<ListServersResponse>(`${API_BASE_PATH}/servers`, {
        ...options,
        query: params as Record<string, string>,
      }),

    getServer: (serverId: string, options?: RequestOptions) =>
      client.get<ServerResponse>(`${API_BASE_PATH}/servers/${serverId}`, options),

    createServer: (
      data: OmitMetadata<CreateServerRequest>,
      options?: RequestOptions
    ) => client.post<ServerResponse>(`${API_BASE_PATH}/servers`, data, options),

    updateServer: (
      serverId: string,
      data: OmitMetadataAndFields<UpdateServerRequest, "serverId">,
      options?: RequestOptions
    ) =>
      client.patch<ServerResponse>(
        `${API_BASE_PATH}/servers/${serverId}`,
        data,
        options
      ),

    deleteServer: (serverId: string, options?: RequestOptions) =>
      client.delete<void>(`${API_BASE_PATH}/servers/${serverId}`, options),

    testServerConnection: (
      data: OmitMetadata<TestServerConnectionRequest>,
      options?: RequestOptions
    ) =>
      client.post<TestServerConnectionResponse>(
        `${API_BASE_PATH}/servers/test-ssh`,
        data,
        options
      ),

    configureServer: (
      serverId: string,
      data: OmitMetadataAndFields<ConfigureServerRequest, "serverId">,
      options?: RequestOptions
    ) =>
      client.post<ConfigureServerResponse>(
        `${API_BASE_PATH}/servers/${serverId}/configure`,
        data,
        options
      ),

    // Clusters
    listClusters: (params?: PaginationQuery, options?: RequestOptions) =>
      client.get<ListClustersResponse>(`${API_BASE_PATH}/clusters`, {
        ...options,
        query: params as Record<string, string>,
      }),

    getCluster: (clusterId: string, options?: RequestOptions) =>
      client.get<ClusterResponse>(
        `${API_BASE_PATH}/clusters/${clusterId}`,
        options
      ),

    createCluster: (
      data: OmitMetadata<CreateClusterRequest>,
      options?: RequestOptions
    ) => client.post<ClusterResponse>(`${API_BASE_PATH}/clusters`, data, options),

    updateCluster: (
      clusterId: string,
      data: OmitMetadataAndFields<UpdateClusterRequest, "clusterId">,
      options?: RequestOptions
    ) =>
      client.patch<ClusterResponse>(
        `${API_BASE_PATH}/clusters/${clusterId}`,
        data,
        options
      ),

    deleteCluster: (clusterId: string, options?: RequestOptions) =>
      client.delete<void>(`${API_BASE_PATH}/clusters/${clusterId}`, options),

    listClusterServers: (clusterId: string, options?: RequestOptions) =>
      client.get<ListServersResponse>(
        `${API_BASE_PATH}/clusters/${clusterId}/servers`,
        options
      ),

    // Agents
    installAgent: (
      serverId: string,
      data: OmitMetadataAndFields<InstallAgentRequest, "serverId">,
      options?: RequestOptions
    ) =>
      client.post<InstallAgentResponse>(
        `${API_BASE_PATH}/servers/${serverId}/agent/install`,
        data,
        options
      ),

    getAgentStatus: (serverId: string, options?: RequestOptions) =>
      client.get<AgentStatusResponse>(
        `${API_BASE_PATH}/servers/${serverId}/agent/status`,
        options
      ),

    // System requirements
    calculateSystemRequirements: (
      data: OmitMetadata<CalculateSystemRequirementsRequest>,
      options?: RequestOptions
    ) =>
      client.post<CalculateSystemRequirementsResponse>(
        `${API_BASE_PATH}/servers/requirements`,
        data,
        options
      ),
  };
}

export type InfrastructureApi = ReturnType<typeof createInfrastructureApi>;

/**
 * Query factories for infrastructure domain
 */
export function createInfrastructureQueries(api: InfrastructureApi) {
  return {
    /**
     * List servers query
     */
    servers: (
      params?: { clusterId?: string } & PaginationQuery
    ): AxionQueryOptions<
      ListServersResponse,
      Error,
      ListServersResponse,
      ReturnType<typeof infrastructureKeys.servers.list>
    > =>
      defineQuery({
        queryKey: infrastructureKeys.servers.list(params),
        queryFn: ({ signal }) => api.listServers(params, { signal }),
        staleTime: STALE_TIME_STANDARD, // 15s
      }),

    /**
     * Get server query
     */
    server: (
      serverId: string
    ): AxionQueryOptions<
      ServerResponse,
      Error,
      ServerResponse,
      ReturnType<typeof infrastructureKeys.servers.detail>
    > =>
      defineQuery({
        queryKey: infrastructureKeys.servers.detail(serverId),
        queryFn: ({ signal }) => api.getServer(serverId, { signal }),
        staleTime: STALE_TIME_LONG, // 30s
      }),

    /**
     * List clusters query
     */
    clusters: (
      params?: PaginationQuery
    ): AxionQueryOptions<
      ListClustersResponse,
      Error,
      ListClustersResponse,
      ReturnType<typeof infrastructureKeys.clusters.list>
    > =>
      defineQuery({
        queryKey: infrastructureKeys.clusters.list(params),
        queryFn: ({ signal }) => api.listClusters(params, { signal }),
        staleTime: STALE_TIME_STANDARD, // 15s
      }),

    /**
     * Get cluster query
     */
    cluster: (
      clusterId: string
    ): AxionQueryOptions<
      ClusterResponse,
      Error,
      ClusterResponse,
      ReturnType<typeof infrastructureKeys.clusters.detail>
    > =>
      defineQuery({
        queryKey: infrastructureKeys.clusters.detail(clusterId),
        queryFn: ({ signal }) => api.getCluster(clusterId, { signal }),
        staleTime: STALE_TIME_LONG, // 30s
      }),

    /**
     * List cluster servers query
     */
    clusterServers: (
      clusterId: string
    ): AxionQueryOptions<
      ListServersResponse,
      Error,
      ListServersResponse,
      ReturnType<typeof infrastructureKeys.clusters.servers>
    > =>
      defineQuery({
        queryKey: infrastructureKeys.clusters.servers(clusterId),
        queryFn: ({ signal }) => api.listClusterServers(clusterId, { signal }),
        staleTime: STALE_TIME_STANDARD, // 15s
      }),

    /**
     * Get agent status query
     */
    agentStatus: (
      serverId: string
    ): AxionQueryOptions<
      AgentStatusResponse,
      Error,
      AgentStatusResponse,
      ReturnType<typeof infrastructureKeys.agents.status>
    > =>
      defineQuery({
        queryKey: infrastructureKeys.agents.status(serverId),
        queryFn: ({ signal }) => api.getAgentStatus(serverId, { signal }),
        staleTime: STALE_TIME_MEDIUM, // 10s
      }),

    /**
     * Calculate system requirements query
     */
    systemRequirements: (
      data: OmitMetadata<CalculateSystemRequirementsRequest>
    ): AxionQueryOptions<
      CalculateSystemRequirementsResponse,
      Error,
      CalculateSystemRequirementsResponse,
      ReturnType<typeof infrastructureKeys.systemRequirements.calculate>
    > =>
      defineQuery({
        queryKey: infrastructureKeys.systemRequirements.calculate(data),
        queryFn: ({ signal }) =>
          api.calculateSystemRequirements(data, { signal }),
        staleTime: STALE_TIME_VERY_LONG, // 1min - calculation is expensive
      }),
  };
}

export type InfrastructureQueries = ReturnType<
  typeof createInfrastructureQueries
>;
