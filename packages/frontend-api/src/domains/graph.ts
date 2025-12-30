/**
 * Graph API domain - Projects, Graphs, and Services
 */

import {
  CreateProjectRequest,
  GraphResponse,
  ListGraphVersionsResponse,
  ListProjectsResponse,
  ListServicesResponse,
  ProjectResponse,
  RevertGraphVersionRequest,
  ServiceResponse,
  UpdateGraphRequest,
  UpdateProjectRequest,
} from "@axion/contracts";
import type { PaginationQuery } from "@axion/shared";

import {
  API_BASE_PATH,
  SERVICE_PATHS,
  STALE_TIME_LONG,
  STALE_TIME_MEDIUM,
  STALE_TIME_STANDARD,
} from "../constants";
import type { HttpClient } from "../http-client";
import { defineQuery } from "../query-options";
import type { AxionQueryOptions } from "../query-options";
import type {
  OmitMetadata,
  OmitMetadataAndFields,
  PickFieldsWithoutMetadata,
  RequestOptions,
} from "../types";

const BASE_PATH = `${API_BASE_PATH}/${SERVICE_PATHS.GRAPH}`;

/**
 * Query keys factory for graph domain
 *
 * Following TanStack Query best practices for hierarchical keys
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */
export const graphKeys = {
  all: () => ["graph"] as const,

  // Projects
  projects: {
    all: () => [...graphKeys.all(), "projects"] as const,
    lists: () => [...graphKeys.projects.all(), "list"] as const,
    list: (params?: PaginationQuery) =>
      [...graphKeys.projects.lists(), params ?? {}] as const,
    details: () => [...graphKeys.projects.all(), "detail"] as const,
    detail: (projectId: string) =>
      [...graphKeys.projects.details(), projectId] as const,
  },

  // Graphs
  graphs: {
    all: () => [...graphKeys.all(), "graphs"] as const,
    details: () => [...graphKeys.graphs.all(), "detail"] as const,
    detail: (projectId: string) =>
      [...graphKeys.graphs.details(), projectId] as const,
    versions: {
      all: () => [...graphKeys.graphs.all(), "versions"] as const,
      list: (projectId: string) =>
        [...graphKeys.graphs.versions.all(), projectId] as const,
    },
  },

  // Services
  services: {
    all: () => [...graphKeys.all(), "services"] as const,
    lists: () => [...graphKeys.services.all(), "list"] as const,
    list: (projectId: string, params?: PaginationQuery) =>
      [...graphKeys.services.lists(), projectId, params ?? {}] as const,
    details: () => [...graphKeys.services.all(), "detail"] as const,
    detail: (projectId: string, nodeId: string) =>
      [...graphKeys.services.details(), projectId, nodeId] as const,
  },
} as const;

/**
 * Graph API client
 */
export function createGraphApi(client: HttpClient) {
  return {
    // Projects
    listProjects: (params?: PaginationQuery, options?: RequestOptions) =>
      client.get<ListProjectsResponse>(`${BASE_PATH}/projects`, {
        ...options,
        query: params as Record<string, string>,
      }),

    getProject: (projectId: string, options?: RequestOptions) =>
      client.get<ProjectResponse>(
        `${BASE_PATH}/projects/${projectId}`,
        options
      ),

    createProject: (
      data: OmitMetadata<CreateProjectRequest>,
      options?: RequestOptions
    ) => client.post<ProjectResponse>(`${BASE_PATH}/projects`, data, options),

    updateProject: (
      projectId: string,
      data: OmitMetadataAndFields<UpdateProjectRequest, "projectId">,
      options?: RequestOptions
    ) =>
      client.patch<ProjectResponse>(
        `${BASE_PATH}/projects/${projectId}`,
        data,
        options
      ),

    deleteProject: (projectId: string, options?: RequestOptions) =>
      client.delete<void>(`${BASE_PATH}/projects/${projectId}`, options),

    // Graph
    getGraph: (projectId: string, options?: RequestOptions) =>
      client.get<GraphResponse>(
        `${BASE_PATH}/projects/${projectId}/graph`,
        options
      ),

    updateGraph: (
      projectId: string,
      data: PickFieldsWithoutMetadata<UpdateGraphRequest, "graphData">,
      options?: RequestOptions
    ) =>
      client.put<GraphResponse>(
        `${BASE_PATH}/projects/${projectId}/graph`,
        data,
        options
      ),

    listGraphVersions: (projectId: string, options?: RequestOptions) =>
      client.get<ListGraphVersionsResponse>(
        `${BASE_PATH}/projects/${projectId}/graph/versions`,
        options
      ),

    revertGraphVersion: (
      projectId: string,
      data: PickFieldsWithoutMetadata<RevertGraphVersionRequest, "version">,
      options?: RequestOptions
    ) =>
      client.post<GraphResponse>(
        `${BASE_PATH}/projects/${projectId}/graph/revert`,
        data,
        options
      ),

    // Services
    listServices: (projectId: string, options?: RequestOptions) =>
      client.get<ListServicesResponse>(
        `${BASE_PATH}/projects/${projectId}/services`,
        options
      ),

    getService: (projectId: string, nodeId: string, options?: RequestOptions) =>
      client.get<ServiceResponse>(
        `${BASE_PATH}/projects/${projectId}/services/${nodeId}`,
        options
      ),
  };
}

export type GraphApi = ReturnType<typeof createGraphApi>;

/**
 * Query factories for graph domain
 */
export function createGraphQueries(api: GraphApi) {
  return {
    /**
     * List projects query
     */
    listProjects: (
      params?: PaginationQuery
    ): AxionQueryOptions<
      ListProjectsResponse,
      Error,
      ListProjectsResponse,
      ReturnType<typeof graphKeys.projects.list>
    > =>
      defineQuery({
        queryKey: graphKeys.projects.list(params),
        queryFn: ({ signal }) => api.listProjects(params, { signal }),
        staleTime: STALE_TIME_LONG,
      }),

    /**
     * Get project query
     */
    project: (
      projectId: string
    ): AxionQueryOptions<
      ProjectResponse,
      Error,
      ProjectResponse,
      ReturnType<typeof graphKeys.projects.detail>
    > =>
      defineQuery({
        queryKey: graphKeys.projects.detail(projectId),
        queryFn: ({ signal }) => api.getProject(projectId, { signal }),
        staleTime: STALE_TIME_LONG,
      }),

    /**
     * Get graph query
     */
    graph: (
      projectId: string
    ): AxionQueryOptions<
      GraphResponse,
      Error,
      GraphResponse,
      ReturnType<typeof graphKeys.graphs.detail>
    > =>
      defineQuery({
        queryKey: graphKeys.graphs.detail(projectId),
        queryFn: ({ signal }) => api.getGraph(projectId, { signal }),
        staleTime: STALE_TIME_MEDIUM,
      }),

    /**
     * List graph versions query
     */
    graphVersions: (
      projectId: string
    ): AxionQueryOptions<
      ListGraphVersionsResponse,
      Error,
      ListGraphVersionsResponse,
      ReturnType<typeof graphKeys.graphs.versions.list>
    > =>
      defineQuery({
        queryKey: graphKeys.graphs.versions.list(projectId),
        queryFn: ({ signal }) => api.listGraphVersions(projectId, { signal }),
        staleTime: STALE_TIME_STANDARD,
      }),

    /**
     * List services query
     */
    services: (
      projectId: string,
      params?: PaginationQuery
    ): AxionQueryOptions<
      ListServicesResponse,
      Error,
      ListServicesResponse,
      ReturnType<typeof graphKeys.services.list>
    > =>
      defineQuery({
        queryKey: graphKeys.services.list(projectId, params),
        queryFn: ({ signal }) => api.listServices(projectId, { signal }),
        staleTime: STALE_TIME_LONG,
      }),

    /**
     * Get service query
     */
    service: (
      projectId: string,
      nodeId: string
    ): AxionQueryOptions<
      ServiceResponse,
      Error,
      ServiceResponse,
      ReturnType<typeof graphKeys.services.detail>
    > =>
      defineQuery({
        queryKey: graphKeys.services.detail(projectId, nodeId),
        queryFn: ({ signal }) => api.getService(projectId, nodeId, { signal }),
        staleTime: STALE_TIME_LONG,
      }),
  };
}

export type GraphQueries = ReturnType<typeof createGraphQueries>;
