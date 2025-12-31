/**
 * @axion/frontend-api - Connect-RPC client and TanStack Query integration
 *
 * This package provides:
 * - Type-safe Connect-RPC client
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

// === Connect Client ===
export {
  createConnectClient,
  createAxionTransport,
  createServiceClient,
  type ConnectClientConfig,
  type ConnectClient,
} from "./connect-client";

// === Types ===
export type { Client, Transport, ConnectError } from "./types";

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
