/**
 * Main client factory and centralized API (Connect-RPC)
 */

import {
  createConnectClient,
  type ConnectClientConfig,
  type ConnectClient,
} from "./connect-client";
import { createGraphApi, createGraphQueries, graphKeys } from "./domains/graph";
import type { GraphApi, GraphQueries } from "./domains/graph";
import {
  createInfrastructureApi,
  createInfrastructureQueries,
  infrastructureKeys,
} from "./domains/infrastructure";
import type {
  InfrastructureApi,
  InfrastructureQueries,
} from "./domains/infrastructure";

/**
 * Centralized query keys for all domains
 */
export const queryKeys = {
  graph: graphKeys,
  infrastructure: infrastructureKeys,
} as const;

/**
 * Frontend API client aggregating all domain APIs
 */
export type FrontendApi = {
  /**
   * Connect client instance
   */
  connectClient: ConnectClient;

  /**
   * Domain APIs
   */
  graph: GraphApi;
  infrastructure: InfrastructureApi;

  /**
   * Query factories for TanStack Query
   */
  queries: {
    graph: GraphQueries;
    infrastructure: InfrastructureQueries;
  };
};

/**
 * Create frontend API client with Connect-RPC
 *
 * @example
 * ```ts
 * // Create client with default config
 * const api = createFrontendApi({
 *   baseUrl: 'https://api.example.com',
 * });
 *
 * // Create client with auth
 * const api = createFrontendApi({
 *   baseUrl: 'https://api.example.com',
 *   getAuthToken: async () => {
 *     return localStorage.getItem('token');
 *   },
 *   getUserId: async () => {
 *     return auth.user?.id;
 *   },
 * });
 *
 * // Use domain APIs
 * const response = await api.graph.listProjects({ page: 1, limit: 10 });
 *
 * // Use query factories
 * const projectQuery = api.queries.graph.project('project-id');
 * const { data } = useQuery(projectQuery);
 * ```
 */
export function createFrontendApi(config: ConnectClientConfig): FrontendApi {
  const connectClient = createConnectClient(config);

  // Create domain APIs
  const graph = createGraphApi(connectClient);
  const infrastructure = createInfrastructureApi(connectClient);

  // Create query factories
  const queries = {
    graph: createGraphQueries(graph),
    infrastructure: createInfrastructureQueries(infrastructure),
  };

  return {
    connectClient,
    graph,
    infrastructure,
    queries,
  };
}
