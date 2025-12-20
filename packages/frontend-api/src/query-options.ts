/**
 * Enhanced query options utilities for TanStack Query
 */

import { queryOptions as tanstackQueryOptions } from "@tanstack/react-query";
import type {
  QueryFunction,
  QueryKey,
  UndefinedInitialDataOptions,
} from "@tanstack/react-query";

/**
 * Query options type with enhanced type safety
 *
 * This uses TanStack Query's queryOptions helper for better type inference
 */
export type AxionQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>;

/**
 * Define query options with enhanced type safety
 *
 * Uses TanStack Query's queryOptions helper which provides:
 * - Better type inference
 * - Type narrowing for enabled queries
 * - Consistent query configuration
 *
 * @example
 * ```ts
 * const projectQuery = defineQuery({
 *   queryKey: ['projects', projectId],
 *   queryFn: ({ signal }) => api.getProject(projectId, { signal }),
 *   staleTime: 1000 * 30,
 * });
 *
 * // Use in useQuery
 * const { data } = useQuery(projectQuery);
 *
 * // Use in prefetchQuery
 * await queryClient.prefetchQuery(projectQuery);
 * ```
 */
export function defineQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> {
  return tanstackQueryOptions(options);
}

/**
 * Create infinite query options helper
 */
export function defineInfiniteQuery<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(options: {
  queryKey: TQueryKey;
  queryFn: QueryFunction<TQueryFnData, TQueryKey, TPageParam>;
  initialPageParam: TPageParam;
  getNextPageParam: (
    lastPage: TQueryFnData,
    allPages: TQueryFnData[],
    lastPageParam: TPageParam
  ) => TPageParam | undefined | null;
  getPreviousPageParam?: (
    firstPage: TQueryFnData,
    allPages: TQueryFnData[],
    firstPageParam: TPageParam
  ) => TPageParam | undefined | null;
  staleTime?: number;
  gcTime?: number;
}) {
  return options;
}

/**
 * Mutation options helper
 */
export function defineMutation<
  TData = unknown,
  TVariables = void,
  TContext = unknown,
>(options: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  onError?: (error: Error, variables: TVariables, context: TContext) => void;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: TContext
  ) => void;
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  retry?: number;
}) {
  return options;
}
