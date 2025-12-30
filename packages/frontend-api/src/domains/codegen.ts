/**
 * Codegen API domain - Code generation and validation
 */

import {
  GenerateProjectRequest,
  GenerateProjectResponse,
  GenerateServiceRequest,
  GenerateServiceResponse,
  ValidateProjectRequest,
  ValidateProjectResponse,
  ValidateServiceRequest,
  ValidateServiceResponse,
  ListBlueprintsRequest,
  ListBlueprintsResponse,
  BlueprintResponse,
} from "@axion/contracts";

import {
  API_BASE_PATH,
  SERVICE_PATHS,
  GC_TIME_SHORT,
  STALE_TIME_SHORT,
  GC_TIME_LONG,
  STALE_TIME_LONG,
} from "../constants";
import type { HttpClient } from "../http-client";
import { defineQuery } from "../query-options";
import type { AxionQueryOptions } from "../query-options";
import type { OmitMetadataAndFields, RequestOptions } from "../types";

const BASE_PATH = `${API_BASE_PATH}/${SERVICE_PATHS.CODEGEN}`;

/**
 * Query keys factory for codegen domain
 */
export const codegenKeys = {
  all: () => ["codegen"] as const,

  // Generation
  generation: {
    all: () => [...codegenKeys.all(), "generation"] as const,
    project: (projectId: string) =>
      [...codegenKeys.generation.all(), "project", projectId] as const,
    service: (projectId: string, nodeId: string) =>
      [...codegenKeys.generation.all(), "service", projectId, nodeId] as const,
  },

  // Validation
  validation: {
    all: () => [...codegenKeys.all(), "validation"] as const,
    project: (
      projectId: string,
      body: OmitMetadataAndFields<ValidateProjectRequest, "projectId">
    ) => [...codegenKeys.validation.all(), "project", projectId, body] as const,
    service: (
      projectId: string,
      nodeId: string,
      body: OmitMetadataAndFields<
        ValidateServiceRequest,
        "projectId" | "nodeId"
      >
    ) =>
      [
        ...codegenKeys.validation.all(),
        "service",
        projectId,
        nodeId,
        body,
      ] as const,
  },

  // Blueprints
  blueprints: {
    all: () => [...codegenKeys.all(), "blueprints"] as const,
    list: (query: OmitMetadataAndFields<ListBlueprintsRequest, never>) =>
      [...codegenKeys.blueprints.all(), "list", query] as const,
    detail: (blueprintId: string) =>
      [...codegenKeys.blueprints.all(), "detail", blueprintId] as const,
  },
} as const;

/**
 * Codegen API client
 */
export function createCodegenApi(client: HttpClient) {
  return {
    // Generation
    generateProject: (
      projectId: string,
      data: OmitMetadataAndFields<GenerateProjectRequest, "projectId">,
      options?: RequestOptions
    ) =>
      client.post<GenerateProjectResponse>(
        `${BASE_PATH}/projects/${projectId}/generate`,
        data,
        options
      ),

    generateService: (
      projectId: string,
      nodeId: string,
      data: OmitMetadataAndFields<
        GenerateServiceRequest,
        "projectId" | "nodeId"
      >,
      options?: RequestOptions
    ) =>
      client.post<GenerateServiceResponse>(
        `${BASE_PATH}/projects/${projectId}/services/${nodeId}/generate`,
        data,
        options
      ),

    // Validation
    validateProject: (
      projectId: string,
      data: OmitMetadataAndFields<ValidateProjectRequest, "projectId">,
      options?: RequestOptions
    ) =>
      client.post<ValidateProjectResponse>(
        `${BASE_PATH}/projects/${projectId}/validate`,
        data,
        options
      ),

    validateService: (
      projectId: string,
      nodeId: string,
      data: OmitMetadataAndFields<
        ValidateServiceRequest,
        "projectId" | "nodeId"
      >,
      options?: RequestOptions
    ) =>
      client.post<ValidateServiceResponse>(
        `${BASE_PATH}/projects/${projectId}/services/${nodeId}/validate`,
        data,
        options
      ),

    // Blueprints
    listBlueprints: (
      query: OmitMetadataAndFields<ListBlueprintsRequest, never> = {},
      options?: RequestOptions
    ) =>
      client.get<ListBlueprintsResponse>(`${BASE_PATH}/blueprints`, {
        ...options,
        query: query as unknown as RequestOptions["query"],
      }),

    getBlueprint: (blueprintId: string, options?: RequestOptions) =>
      client.get<BlueprintResponse>(
        `${BASE_PATH}/blueprints/${blueprintId}`,
        options
      ),
  };
}

export type CodegenApi = ReturnType<typeof createCodegenApi>;

/**
 * Query factories for codegen domain
 *
 * Note: Generation and validation are typically mutations, not queries.
 * However, validation can be used as a query for real-time validation.
 */
export function createCodegenQueries(api: CodegenApi) {
  return {
    /**
     * Validate project query (for real-time validation)
     */
    validateProject: (
      projectId: string,
      body: OmitMetadataAndFields<ValidateProjectRequest, "projectId">
    ): AxionQueryOptions<
      ValidateProjectResponse,
      Error,
      ValidateProjectResponse,
      ReturnType<typeof codegenKeys.validation.project>
    > =>
      defineQuery({
        queryKey: codegenKeys.validation.project(projectId, body),
        queryFn: ({ signal }) =>
          api.validateProject(projectId, body, { signal }),
        staleTime: STALE_TIME_SHORT,
        gcTime: GC_TIME_SHORT,
      }),

    /**
     * Validate service query (for real-time validation)
     */
    validateService: (
      projectId: string,
      nodeId: string,
      body: OmitMetadataAndFields<
        ValidateServiceRequest,
        "projectId" | "nodeId"
      >
    ): AxionQueryOptions<
      ValidateServiceResponse,
      Error,
      ValidateServiceResponse,
      ReturnType<typeof codegenKeys.validation.service>
    > =>
      defineQuery({
        queryKey: codegenKeys.validation.service(projectId, nodeId, body),
        queryFn: ({ signal }) =>
          api.validateService(projectId, nodeId, body, { signal }),
        staleTime: STALE_TIME_SHORT,
        gcTime: GC_TIME_SHORT,
      }),

    /**
     * List blueprints query
     */
    listBlueprints: (
      query: OmitMetadataAndFields<ListBlueprintsRequest, never> = {}
    ): AxionQueryOptions<
      ListBlueprintsResponse,
      Error,
      ListBlueprintsResponse,
      ReturnType<typeof codegenKeys.blueprints.list>
    > =>
      defineQuery({
        queryKey: codegenKeys.blueprints.list(query),
        queryFn: ({ signal }) => api.listBlueprints(query, { signal }),
        // Blueprints change rarely, cache for longer
        staleTime: STALE_TIME_LONG,
        gcTime: GC_TIME_LONG,
      }),

    /**
     * Get blueprint detail query
     */
    getBlueprint: (
      blueprintId: string
    ): AxionQueryOptions<
      BlueprintResponse,
      Error,
      BlueprintResponse,
      ReturnType<typeof codegenKeys.blueprints.detail>
    > =>
      defineQuery({
        queryKey: codegenKeys.blueprints.detail(blueprintId),
        queryFn: ({ signal }) => api.getBlueprint(blueprintId, { signal }),
        staleTime: STALE_TIME_LONG,
        gcTime: GC_TIME_LONG,
      }),
  };
}

export type CodegenQueries = ReturnType<typeof createCodegenQueries>;
