import {
  type ListServersResponse,
  type GetServerResponse,
  type RegisterServerRequest,
  type RegisterServerResponse,
  type UpdateServerStatusRequest,
  type UpdateServerStatusResponse,
  type DeleteServerResponse,
  type ListClustersResponse,
  type GetClusterResponse,
  type CreateClusterRequest,
  type CreateClusterResponse,
  type UpdateClusterRequest,
  type UpdateClusterResponse,
  type DeleteClusterResponse,
  RequestMetadataSchema,
  PAGINATION_DEFAULTS,
} from "@axion/contracts";
import {
  ListServersRequestSchema,
  GetServerRequestSchema,
  RegisterServerRequestSchema,
  UpdateServerStatusRequestSchema,
  DeleteServerRequestSchema,
  ListClustersRequestSchema,
  GetClusterRequestSchema,
  CreateClusterRequestSchema,
  UpdateClusterRequestSchema,
  DeleteClusterRequestSchema,
} from "@axion/contracts/generated/infrastructure/server_pb";
import { InfrastructureService } from "@axion/contracts/generated/infrastructure/service_pb";
import type { PaginationQuery } from "@axion/shared";
import { create } from "@bufbuild/protobuf";
import { timestampFromMs } from "@bufbuild/protobuf/wkt";

import type { ConnectClient } from "../connect-client";
import { STALE_TIME_LONG, STALE_TIME_MEDIUM } from "../constants";
import { defineQuery } from "../query-options";
import type { AxionQueryOptions } from "../query-options";

/**
 * Query keys factory for infrastructure domain
 */
export const infrastructureKeys = {
  all: () => ["infrastructure"] as const,
  servers: {
    all: () => [...infrastructureKeys.all(), "servers"] as const,
    lists: () => [...infrastructureKeys.servers.all(), "list"] as const,
    list: (params?: PaginationQuery) =>
      [...infrastructureKeys.servers.lists(), params ?? {}] as const,
    details: () => [...infrastructureKeys.servers.all(), "detail"] as const,
    detail: (serverId: string) =>
      [...infrastructureKeys.servers.details(), serverId] as const,
  },
  clusters: {
    all: () => [...infrastructureKeys.all(), "clusters"] as const,
    lists: () => [...infrastructureKeys.clusters.all(), "list"] as const,
    list: (params?: PaginationQuery) =>
      [...infrastructureKeys.clusters.lists(), params ?? {}] as const,
    details: () => [...infrastructureKeys.clusters.all(), "detail"] as const,
    detail: (clusterId: string) =>
      [...infrastructureKeys.clusters.details(), clusterId] as const,
  },
} as const;

/**
 * Infrastructure API client
 */
export function createInfrastructureApi(connectClient: ConnectClient) {
  const client = connectClient.createClient(InfrastructureService);

  const getMetadata = async () => {
    const userId =
      (await connectClient.config.getUserId?.()) || crypto.randomUUID(); // Fallback to random UUID if no user
    return create(RequestMetadataSchema, {
      userId,
      requestId: crypto.randomUUID(),
      sessionId: "current-session",
      timestamp: timestampFromMs(Date.now()),
    });
  };

  return {
    // Servers
    listServers: async (
      params?: PaginationQuery
    ): Promise<ListServersResponse> => {
      const request = create(ListServersRequestSchema, {
        metadata: await getMetadata(),
        pagination: params
          ? {
              page: Number(params.page) || PAGINATION_DEFAULTS.page,
              limit: Number(params.limit) || PAGINATION_DEFAULTS.limit,
              total: 0,
            }
          : undefined,
      });
      return client.listServers(request);
    },

    getServer: async (serverId: string): Promise<GetServerResponse> => {
      const request = create(GetServerRequestSchema, {
        metadata: await getMetadata(),
        serverId,
      });
      return client.getServer(request);
    },

    registerServer: async (
      data: Omit<RegisterServerRequest, "metadata">
    ): Promise<RegisterServerResponse> => {
      const request = create(RegisterServerRequestSchema, {
        metadata: await getMetadata(),
        name: data.name,
        hostname: data.hostname,
        ipAddress: data.ipAddress,
        metadataFields: data.metadataFields,
        clusterId: data.clusterId,
      });
      return client.registerServer(request);
    },

    updateServerStatus: async (
      serverId: string,
      data: Omit<UpdateServerStatusRequest, "metadata" | "serverId">
    ): Promise<UpdateServerStatusResponse> => {
      const request = create(UpdateServerStatusRequestSchema, {
        metadata: await getMetadata(),
        serverId,
        status: data.status,
      });
      return client.updateServerStatus(request);
    },

    deleteServer: async (serverId: string): Promise<DeleteServerResponse> => {
      const request = create(DeleteServerRequestSchema, {
        metadata: await getMetadata(),
        serverId,
      });
      return client.deleteServer(request);
    },

    // Clusters
    listClusters: async (
      params?: PaginationQuery
    ): Promise<ListClustersResponse> => {
      const request = create(ListClustersRequestSchema, {
        metadata: await getMetadata(),
        pagination: params
          ? {
              page: Number(params.page) || PAGINATION_DEFAULTS.page,
              limit: Number(params.limit) || PAGINATION_DEFAULTS.limit,
              total: 0,
            }
          : undefined,
      });
      return client.listClusters(request);
    },

    getCluster: async (clusterId: string): Promise<GetClusterResponse> => {
      const request = create(GetClusterRequestSchema, {
        metadata: await getMetadata(),
        clusterId,
      });
      return client.getCluster(request);
    },

    createCluster: async (
      data: Omit<CreateClusterRequest, "metadata">
    ): Promise<CreateClusterResponse> => {
      const request = create(CreateClusterRequestSchema, {
        metadata: await getMetadata(),
        name: data.name,
        description: data.description,
        metadataFields: data.metadataFields,
      });
      return client.createCluster(request);
    },

    updateCluster: async (
      clusterId: string,
      data: Omit<UpdateClusterRequest, "metadata" | "clusterId">
    ): Promise<UpdateClusterResponse> => {
      const request = create(UpdateClusterRequestSchema, {
        metadata: await getMetadata(),
        clusterId,
        name: data.name,
        description: data.description,
      });
      return client.updateCluster(request);
    },

    deleteCluster: async (
      clusterId: string
    ): Promise<DeleteClusterResponse> => {
      const request = create(DeleteClusterRequestSchema, {
        metadata: await getMetadata(),
        clusterId,
      });
      return client.deleteCluster(request);
    },
  };
}

export type InfrastructureApi = ReturnType<typeof createInfrastructureApi>;

/**
 * Query factories for infrastructure domain
 */
export function createInfrastructureQueries(api: InfrastructureApi) {
  return {
    servers: (
      params?: PaginationQuery
    ): AxionQueryOptions<
      ListServersResponse,
      Error,
      ListServersResponse,
      ReturnType<typeof infrastructureKeys.servers.list>
    > =>
      defineQuery({
        queryKey: infrastructureKeys.servers.list(params),
        queryFn: () => api.listServers(params),
        staleTime: STALE_TIME_MEDIUM,
      }),

    server: (
      serverId: string
    ): AxionQueryOptions<
      GetServerResponse,
      Error,
      GetServerResponse,
      ReturnType<typeof infrastructureKeys.servers.detail>
    > =>
      defineQuery({
        queryKey: infrastructureKeys.servers.detail(serverId),
        queryFn: () => api.getServer(serverId),
        staleTime: STALE_TIME_LONG,
      }),

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
        queryFn: () => api.listClusters(params),
        staleTime: STALE_TIME_MEDIUM,
      }),

    cluster: (
      clusterId: string
    ): AxionQueryOptions<
      GetClusterResponse,
      Error,
      GetClusterResponse,
      ReturnType<typeof infrastructureKeys.clusters.detail>
    > =>
      defineQuery({
        queryKey: infrastructureKeys.clusters.detail(clusterId),
        queryFn: () => api.getCluster(clusterId),
        staleTime: STALE_TIME_LONG,
      }),
  };
}

export type InfrastructureQueries = ReturnType<
  typeof createInfrastructureQueries
>;
