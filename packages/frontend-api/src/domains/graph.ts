/**
 * Graph API domain - Projects and Graphs (Connect-RPC)
 */

import {
  GraphService,
  type GetProjectResponse,
  type ListProjectsResponse,
  type GetGraphResponse,
  type GraphData,
} from "@axion/contracts";
import { PaginationSchema } from "@axion/contracts/generated/common/common_pb";
import {
  CreateProjectRequestSchema,
  GetProjectRequestSchema,
  UpdateProjectRequestSchema,
  DeleteProjectRequestSchema,
  ListProjectsRequestSchema,
  GetGraphRequestSchema,
  UpdateGraphRequestSchema,
} from "@axion/contracts/generated/graph/project_pb";
import type { PaginationQuery } from "@axion/shared";
import { create } from "@bufbuild/protobuf";

import type { ConnectClient } from "../connect-client";
import { STALE_TIME_LONG, STALE_TIME_MEDIUM } from "../constants";
import { defineQuery } from "../query-options";
import type { AxionQueryOptions } from "../query-options";

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
  },
} as const;

/**
 * Graph API client using Connect-RPC
 */
export function createGraphApi(connectClient: ConnectClient) {
  const client = connectClient.createClient(GraphService);

  return {
    // Projects
    listProjects: async (
      params?: PaginationQuery
    ): Promise<ListProjectsResponse> => {
      const request = create(ListProjectsRequestSchema, {
        metadata: undefined,
        pagination: params
          ? create(PaginationSchema, {
              page: Number(params.page ?? 1),
              limit: Number(params.limit ?? 10),
              total: 0,
            })
          : undefined,
      });
      return client.listProjects(request);
    },

    getProject: async (projectId: string): Promise<GetProjectResponse> => {
      const request = create(GetProjectRequestSchema, {
        metadata: undefined,
        projectId,
      });
      return client.getProject(request);
    },

    createProject: async (data: { name: string; description?: string }) => {
      const request = create(CreateProjectRequestSchema, {
        metadata: undefined,
        name: data.name,
        description: data.description,
      });
      return client.createProject(request);
    },

    updateProject: async (
      projectId: string,
      data: { name?: string; description?: string }
    ) => {
      const request = create(UpdateProjectRequestSchema, {
        metadata: undefined,
        projectId,
        name: data.name,
        description: data.description,
      });
      return client.updateProject(request);
    },

    deleteProject: async (projectId: string): Promise<void> => {
      const request = create(DeleteProjectRequestSchema, {
        metadata: undefined,
        projectId,
      });
      await client.deleteProject(request);
    },

    // Graph
    getGraph: async (projectId: string): Promise<GetGraphResponse> => {
      const request = create(GetGraphRequestSchema, {
        metadata: undefined,
        projectId,
      });
      return client.getGraph(request);
    },

    updateGraph: async (projectId: string, data: { graph?: GraphData }) => {
      const request = create(UpdateGraphRequestSchema, {
        metadata: undefined,
        projectId,
        graph: data.graph,
      });
      return client.updateGraph(request);
    },
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
        queryFn: () => api.listProjects(params),
        staleTime: STALE_TIME_LONG,
      }),

    /**
     * Get project query
     */
    project: (
      projectId: string
    ): AxionQueryOptions<
      GetProjectResponse,
      Error,
      GetProjectResponse,
      ReturnType<typeof graphKeys.projects.detail>
    > =>
      defineQuery({
        queryKey: graphKeys.projects.detail(projectId),
        queryFn: () => api.getProject(projectId),
        staleTime: STALE_TIME_LONG,
      }),

    /**
     * Get graph query
     */
    graph: (
      projectId: string
    ): AxionQueryOptions<
      GetGraphResponse,
      Error,
      GetGraphResponse,
      ReturnType<typeof graphKeys.graphs.detail>
    > =>
      defineQuery({
        queryKey: graphKeys.graphs.detail(projectId),
        queryFn: () => api.getGraph(projectId),
        staleTime: STALE_TIME_MEDIUM,
      }),
  };
}

export type GraphQueries = ReturnType<typeof createGraphQueries>;
