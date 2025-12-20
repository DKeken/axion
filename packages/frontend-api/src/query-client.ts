/**
 * QueryClient factory with sensible defaults for Axion Stack
 */

import { QueryClient } from "@tanstack/react-query";

import {
  DEFAULT_QUERY_GC_TIME,
  DEFAULT_QUERY_STALE_TIME,
  MAX_RETRY_DELAY,
} from "./constants";

export type QueryClientFactoryOptions = {
  /**
   * Default stale time in milliseconds
   * @default DEFAULT_QUERY_STALE_TIME (30s)
   */
  staleTimeMs?: number;

  /**
   * Default garbage collection time in milliseconds
   * @default DEFAULT_QUERY_GC_TIME (5min)
   */
  gcTimeMs?: number;

  /**
   * Number of retries for failed queries
   * @default 2
   */
  retryQueries?: number;

  /**
   * Number of retries for failed mutations
   * @default 1
   */
  retryMutations?: number;

  /**
   * Refetch on window focus
   * @default false
   */
  refetchOnWindowFocus?: boolean;

  /**
   * Refetch on reconnect
   * @default true
   */
  refetchOnReconnect?: boolean;

  /**
   * Enable dev tools
   * @default false
   */
  enableDevTools?: boolean;
};

/**
 * Create QueryClient with sensible defaults for Axion Stack
 *
 * @example
 * ```tsx
 * import { createQueryClient } from '@axion/frontend-api';
 * import { QueryClientProvider } from '@tanstack/react-query';
 *
 * const queryClient = createQueryClient({
 *   staleTimeMs: 60_000, // 1 minute
 *   retryQueries: 3,
 * });
 *
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <YourApp />
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
export function createQueryClient(
  options?: QueryClientFactoryOptions
): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: options?.staleTimeMs ?? DEFAULT_QUERY_STALE_TIME,
        gcTime: options?.gcTimeMs ?? DEFAULT_QUERY_GC_TIME,
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
        refetchOnReconnect: options?.refetchOnReconnect ?? true,
        retry: options?.retryQueries ?? 2,
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, MAX_RETRY_DELAY),
      },
      mutations: {
        retry: options?.retryMutations ?? 1,
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, MAX_RETRY_DELAY),
      },
    },
  });
}
