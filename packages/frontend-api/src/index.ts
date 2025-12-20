/**
 * @axion/frontend-api - Typed frontend HTTP client and TanStack Query integration
 *
 * This package provides:
 * - Type-safe HTTP client based on Ky
 * - SSE client for real-time updates
 * - TanStack Query integration with query factories
 * - Domain-specific APIs (graph, codegen, deployment, infrastructure)
 * - Protobuf contract types from @axion/contracts
 *
 * @example
 * ```ts
 * import { createFrontendApi, queryKeys } from '@axion/frontend-api';
 * import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
 *
 * // Create API client
 * const api = createFrontendApi({
 *   baseUrl: 'https://api.example.com',
 *   getAuthToken: async () => localStorage.getItem('token'),
 * });
 *
 * // Use in React component
 * function ProjectsList() {
 *   const { data, isLoading } = useQuery(
 *     api.queries.graph.listProjects()
 *   );
 *
 *   // ...
 * }
 *
 * // Invalidate queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.graph.projects.all() });
 * ```
 */

// === Core exports ===
export { createFrontendApi, queryKeys, type FrontendApi } from "./client";

// === Constants ===
export * from "./constants";

// === HTTP Client ===
export { createHttpClient, HttpClient } from "./http-client";

export type { ApiClientConfig, RequestOptions } from "./types";

export { ApiError, fromKyError } from "./types";

// === SSE Client ===
export {
  createSSEClient,
  SSEClient,
  type SSEClientConfig,
  type SSEMessageHandler,
  type SSEErrorHandler,
  type SSEOpenHandler,
} from "./sse-client";

// === Query Options ===
export {
  defineQuery,
  defineInfiniteQuery,
  defineMutation,
  type AxionQueryOptions,
} from "./query-options";

// === Query Client ===
export {
  createQueryClient,
  type QueryClientFactoryOptions,
} from "./query-client";

// === Domain APIs ===

// Graph
export {
  createGraphApi,
  createGraphQueries,
  graphKeys,
  type GraphApi,
  type GraphQueries,
} from "./domains/graph";

// Codegen
export {
  createCodegenApi,
  createCodegenQueries,
  codegenKeys,
  type CodegenApi,
  type CodegenQueries,
} from "./domains/codegen";

// Deployment
export {
  createDeploymentApi,
  createDeploymentQueries,
  deploymentKeys,
  type DeploymentApi,
  type DeploymentQueries,
} from "./domains/deployment";

// Infrastructure
export {
  createInfrastructureApi,
  createInfrastructureQueries,
  infrastructureKeys,
  type InfrastructureApi,
  type InfrastructureQueries,
} from "./domains/infrastructure";

// === Helper types ===
export type {
  OmitMetadata,
  OmitMetadataAndFields,
  PickFieldsWithoutMetadata,
} from "./types";
