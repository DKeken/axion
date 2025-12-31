/**
 * Health status utilities
 */

/**
 * Health status enum for services
 */
export enum HealthStatus {
  HEALTHY = "healthy",
  UNHEALTHY = "unhealthy",
  DEGRADED = "degraded",
  UNKNOWN = "unknown",
}

/**
 * Check if status is healthy
 */
export function isHealthy(status: HealthStatus): boolean {
  return status === HealthStatus.HEALTHY;
}

/**
 * Check if status requires attention
 */
export function requiresAttention(status: HealthStatus): boolean {
  return status === HealthStatus.UNHEALTHY || status === HealthStatus.DEGRADED;
}

