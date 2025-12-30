/**
 * Main client factory and centralized API
 */

import { createCodegenApi, createCodegenQueries, codegenKeys } from "./domains/codegen";
import type { CodegenApi, CodegenQueries } from "./domains/codegen";
import { createDeploymentApi, createDeploymentQueries, deploymentKeys } from "./domains/deployment";
import type { DeploymentApi, DeploymentQueries } from "./domains/deployment";
import { createGraphApi, createGraphQueries, graphKeys } from "./domains/graph";
import type { GraphApi, GraphQueries } from "./domains/graph";
import { createInfrastructureApi, createInfrastructureQueries, infrastructureKeys } from "./domains/infrastructure";
import type { InfrastructureApi, InfrastructureQueries } from "./domains/infrastructure";
import { createHttpClient } from "./http-client";
import type { HttpClient } from "./http-client";
import type { ApiClientConfig } from "./types";

/**
 * Centralized query keys for all domains
 */
export const queryKeys = {
  graph: graphKeys,
  codegen: codegenKeys,
  deployment: deploymentKeys,
  infrastructure: infrastructureKeys,
} as const;

/**
 * Frontend API client aggregating all domain APIs
 */
export type FrontendApi = {
  /**
   * HTTP client instance
   */
  client: HttpClient;

  /**
   * Domain APIs
   */
  graph: GraphApi;
  codegen: CodegenApi;
  deployment: DeploymentApi;
  infrastructure: InfrastructureApi;

  /**
   * Query factories for TanStack Query
   */
  queries: {
    graph: GraphQueries;
    codegen: CodegenQueries;
    deployment: DeploymentQueries;
    infrastructure: InfrastructureQueries;
  };
};

/**
 * Create frontend API client
 *
 * @example
 * ```ts
 * // Create client with default config
 * const api = createFrontendApi();
 *
 * // Create client with custom config
 * const api = createFrontendApi({
 *   baseUrl: 'https://api.example.com',
 *   getAuthToken: async () => {
 *     return localStorage.getItem('token');
 *   },
 *   onError: (error) => {
 *     console.error('API Error:', error);
 *   },
 * });
 *
 * // Use domain APIs
 * const projects = await api.graph.listProjects({ pagination: undefined });
 *
 * // Use query factories
 * const projectQuery = api.queries.graph.project('project-id');
 * const { data } = useQuery(projectQuery);
 * ```
 */
export function createFrontendApi(config?: ApiClientConfig): FrontendApi {
  const client = createHttpClient(config);

  // Create domain APIs
  const graph = createGraphApi(client);
  const codegen = createCodegenApi(client);
  const deployment = createDeploymentApi(client);
  const infrastructure = createInfrastructureApi(client);

  // Create query factories
  const queries = {
    graph: createGraphQueries(graph),
    codegen: createCodegenQueries(codegen),
    deployment: createDeploymentQueries(deployment),
    infrastructure: createInfrastructureQueries(infrastructure),
  };

  return {
    client,
    graph,
    codegen,
    deployment,
    infrastructure,
    queries,
  };
}
