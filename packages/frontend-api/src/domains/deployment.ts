/**
 * Deployment API domain - Deployments and rollbacks
 */

import {
  DeploymentStatus,
  type DeployProjectRequest,
  type DeployProjectResponse,
  type DeploymentResponse,
  type DeploymentStatusResponse,
  type ListDeploymentsResponse,
  type RollbackDeploymentRequest,
  type RollbackDeploymentResponse,
} from "@axion/contracts";
import type { PaginationQuery } from "@axion/nestjs-common";

import {
  API_BASE_PATH,
  REFETCH_INTERVAL_DEPLOYMENT_STATUS,
  STALE_TIME_MEDIUM,
  STALE_TIME_VERY_SHORT,
} from "../constants";
import type { HttpClient } from "../http-client";
import { defineQuery, type AxionQueryOptions } from "../query-options";
import type {
  OmitMetadata,
  OmitMetadataAndFields,
  RequestOptions,
} from "../types";

/**
 * Query keys factory for deployment domain
 */
export const deploymentKeys = {
  all: () => ["deployment"] as const,

  // Deployments
  deployments: {
    all: () => [...deploymentKeys.all(), "deployments"] as const,
    lists: () => [...deploymentKeys.deployments.all(), "list"] as const,
    list: (
      projectId: string,
      params?: PaginationQuery & { statusFilter?: DeploymentStatus }
    ) =>
      [...deploymentKeys.deployments.lists(), projectId, params ?? {}] as const,
    details: () => [...deploymentKeys.deployments.all(), "detail"] as const,
    detail: (deploymentId: string) =>
      [...deploymentKeys.deployments.details(), deploymentId] as const,
    status: (deploymentId: string) =>
      [...deploymentKeys.deployments.detail(deploymentId), "status"] as const,
  },
} as const;

/**
 * Deployment API client
 */
export function createDeploymentApi(client: HttpClient) {
  return {
    // Deploy
    deployProject: (
      data: OmitMetadata<DeployProjectRequest>,
      options?: RequestOptions
    ) =>
      client.post<DeployProjectResponse>(
        `${API_BASE_PATH}/deployments`,
        data,
        options
      ),

    // Get deployment
    getDeployment: (deploymentId: string, options?: RequestOptions) =>
      client.get<DeploymentResponse>(
        `${API_BASE_PATH}/deployments/${deploymentId}`,
        options
      ),

    // List deployments
    listDeployments: (
      projectId: string,
      params?: PaginationQuery & { statusFilter?: DeploymentStatus },
      options?: RequestOptions
    ) => {
      const query: Record<string, string | number> = {
        projectId,
      };

      if (params?.page) query.page = params.page;
      if (params?.limit) query.limit = params.limit;
      if (params?.statusFilter !== undefined) {
        query.statusFilter = params.statusFilter;
      }

      return client.get<ListDeploymentsResponse>(
        `${API_BASE_PATH}/deployments`,
        {
          ...options,
          query,
        }
      );
    },

    // Get deployment status
    getDeploymentStatus: (deploymentId: string, options?: RequestOptions) =>
      client.get<DeploymentStatusResponse>(
        `${API_BASE_PATH}/deployments/${deploymentId}/status`,
        options
      ),

    // Rollback
    rollbackDeployment: (
      deploymentId: string,
      data: OmitMetadataAndFields<RollbackDeploymentRequest, "deploymentId">,
      options?: RequestOptions
    ) =>
      client.post<RollbackDeploymentResponse>(
        `${API_BASE_PATH}/deployments/${deploymentId}/rollback`,
        data,
        options
      ),

    // Cancel deployment
    cancelDeployment: (deploymentId: string, options?: RequestOptions) =>
      client.post<void>(
        `${API_BASE_PATH}/deployments/${deploymentId}/cancel`,
        {},
        options
      ),
  };
}

export type DeploymentApi = ReturnType<typeof createDeploymentApi>;

/**
 * Query factories for deployment domain
 */
export function createDeploymentQueries(api: DeploymentApi) {
  return {
    /**
     * List deployments query
     */
    deployments: (
      projectId: string,
      params?: PaginationQuery & { statusFilter?: DeploymentStatus }
    ): AxionQueryOptions<
      ListDeploymentsResponse,
      Error,
      ListDeploymentsResponse,
      ReturnType<typeof deploymentKeys.deployments.list>
    > =>
      defineQuery({
        queryKey: deploymentKeys.deployments.list(projectId, params),
        queryFn: ({ signal }) =>
          api.listDeployments(projectId, params, { signal }),
        staleTime: STALE_TIME_MEDIUM, // 10s - deployments change frequently
      }),

    /**
     * Get deployment query
     */
    deployment: (
      deploymentId: string
    ): AxionQueryOptions<
      DeploymentResponse,
      Error,
      DeploymentResponse,
      ReturnType<typeof deploymentKeys.deployments.detail>
    > =>
      defineQuery({
        queryKey: deploymentKeys.deployments.detail(deploymentId),
        queryFn: ({ signal }) => api.getDeployment(deploymentId, { signal }),
        staleTime: STALE_TIME_MEDIUM, // 10s
      }),

    /**
     * Get deployment status query (for real-time updates)
     */
    deploymentStatus: (
      deploymentId: string
    ): AxionQueryOptions<
      DeploymentStatusResponse,
      Error,
      DeploymentStatusResponse,
      ReturnType<typeof deploymentKeys.deployments.status>
    > =>
      defineQuery({
        queryKey: deploymentKeys.deployments.status(deploymentId),
        queryFn: ({ signal }) =>
          api.getDeploymentStatus(deploymentId, { signal }),
        staleTime: STALE_TIME_VERY_SHORT, // 3s - status changes frequently
        refetchInterval: REFETCH_INTERVAL_DEPLOYMENT_STATUS, // Refetch every 5s for active deployments
      }),
  };
}

export type DeploymentQueries = ReturnType<typeof createDeploymentQueries>;
