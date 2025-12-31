import { HealthStatus } from "@axion/contracts";

/**
 * Health check utilities
 */

export type HealthCheckDependency = {
  name: string;
  status: HealthStatus;
  message?: string;
  response_time_ms?: number;
}

export type HealthCheckResult = {
  status: HealthStatus;
  service_name: string;
  timestamp: number;
  details?: Record<string, string>;
  dependencies?: HealthCheckDependency[];
}

export function createHealthyStatus(
  serviceName: string,
  details?: Record<string, string>,
  dependencies?: HealthCheckDependency[]
): HealthCheckResult {
  return {
    status: HealthStatus.HEALTHY,
    service_name: serviceName,
    timestamp: Date.now(),
    ...(details && { details }),
    ...(dependencies && { dependencies }),
  };
}

export function createDegradedStatus(
  serviceName: string,
  message: string,
  dependencies?: HealthCheckDependency[]
): HealthCheckResult {
  return {
    status: HealthStatus.DEGRADED,
    service_name: serviceName,
    timestamp: Date.now(),
    details: { message },
    ...(dependencies && { dependencies }),
  };
}

export function createUnhealthyStatus(
  serviceName: string,
  message: string,
  dependencies?: HealthCheckDependency[]
): HealthCheckResult {
  return {
    status: HealthStatus.UNHEALTHY,
    service_name: serviceName,
    timestamp: Date.now(),
    details: { message },
    ...(dependencies && { dependencies }),
  };
}

export function createHealthDependency(
  name: string,
  status: HealthStatus,
  message?: string,
  responseTimeMs?: number
): HealthCheckDependency {
  return {
    name,
    status,
    ...(message && { message }),
    ...(responseTimeMs !== undefined && { response_time_ms: responseTimeMs }),
  };
}

export function isHealthy(health: HealthCheckResult): boolean {
  return health.status === HealthStatus.HEALTHY;
}

export function createDatabaseHealthDependency(
  connected: boolean,
  responseTimeMs?: number
): HealthCheckDependency {
  return createHealthDependency(
    "database",
    connected
      ? HealthStatus.HEALTHY
      : HealthStatus.UNHEALTHY,
    connected ? "Connected" : "Disconnected",
    responseTimeMs
  );
}

export function createRedisHealthDependency(
  connected: boolean,
  responseTimeMs?: number
): HealthCheckDependency {
  return createHealthDependency(
    "redis",
    connected
      ? HealthStatus.HEALTHY
      : HealthStatus.UNHEALTHY,
    connected ? "Connected" : "Disconnected",
    responseTimeMs
  );
}
