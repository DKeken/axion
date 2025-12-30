/**
 * Centralized constants for frontend-api package
 */

// ============================================================================
// HTTP Client Constants
// ============================================================================

/**
 * Default base URL for API requests
 */
export const DEFAULT_BASE_URL =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ??
      process.env.API_URL ??
      "http://localhost:3000")
    : "http://localhost:3000";

/**
 * Default retry limit for failed requests
 */
export const DEFAULT_RETRY_LIMIT = 2;

/**
 * Default request timeout in milliseconds
 */
export const DEFAULT_TIMEOUT = 30_000; // 30 seconds

/**
 * Default HTTP status codes to retry on
 */
export const DEFAULT_RETRY_STATUS_CODES = [408, 409, 429, 500, 502, 503, 504];

// ============================================================================
// API Path Constants
// ============================================================================

/**
 * Base API path for all requests
 */
export const API_BASE_PATH = "api/v1";

/**
 * Service specific API paths
 * Matches Traefik routing in docker/services.config.ts
 */
export const SERVICE_PATHS = {
  GRAPH: "graph/api",
  CODEGEN: "codegen/api",
  DEPLOYMENT: "deployment/api",
  INFRASTRUCTURE: "infrastructure/api",
} as const;

// ============================================================================
// TanStack Query Constants (staleTime in milliseconds)
// ============================================================================

/**
 * Default stale time for QueryClient (30 seconds)
 */
export const DEFAULT_QUERY_STALE_TIME = 30_000;

/**
 * Default garbage collection time for QueryClient (5 minutes)
 */
export const DEFAULT_QUERY_GC_TIME = 300_000;

/**
 * Stale time for frequently changing data (3 seconds)
 * Use for: deployment status, live updates
 */
export const STALE_TIME_VERY_SHORT = 3_000;

/**
 * Stale time for fast-changing data (5 seconds)
 * Use for: validation results
 */
export const STALE_TIME_SHORT = 5_000;

/**
 * Stale time for moderately changing data (10 seconds)
 * Use for: deployments, agent status, graphs
 */
export const STALE_TIME_MEDIUM = 10_000;

/**
 * Stale time for semi-stable data (15 seconds)
 * Use for: servers list, clusters list, graph versions
 */
export const STALE_TIME_STANDARD = 15_000;

/**
 * Stale time for stable data (30 seconds)
 * Use for: projects, servers detail, services
 */
export const STALE_TIME_LONG = 30_000;

/**
 * Stale time for expensive/rarely changing data (1 minute)
 * Use for: system requirements calculations
 */
export const STALE_TIME_VERY_LONG = 60_000;

/**
 * Garbage collection time for validation results (1 minute)
 */
export const GC_TIME_SHORT = 60_000;

/**
 * Garbage collection time for standard data (2.5 minutes)
 */
export const GC_TIME_MEDIUM = 150_000;

/**
 * Garbage collection time for stable data (5 minutes)
 */
export const GC_TIME_LONG = 300_000;

/**
 * Refetch interval for active deployments (5 seconds)
 */
export const REFETCH_INTERVAL_DEPLOYMENT_STATUS = 5_000;

// ============================================================================
// SSE Client Constants
// ============================================================================

/**
 * Default reconnect delay for SSE client (3 seconds)
 */
export const SSE_DEFAULT_RECONNECT_DELAY = 3_000;

/**
 * Default maximum reconnect attempts for SSE client
 */
export const SSE_DEFAULT_MAX_RECONNECT_ATTEMPTS = Number.POSITIVE_INFINITY;

/**
 * Maximum retry delay for exponential backoff (30 seconds)
 */
export const MAX_RETRY_DELAY = 30_000;
