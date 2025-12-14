import { HealthStatus } from "@axion/contracts";

/**
 * Health check utilities
 */

export interface HealthCheckDependency {
  name: string;
  status: HealthStatus;
  message?: string;
  response_time_ms?: number;
}

export interface HealthCheckResult {
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
    status: HealthStatus.HEALTH_STATUS_HEALTHY,
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
    status: HealthStatus.HEALTH_STATUS_DEGRADED,
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
    status: HealthStatus.HEALTH_STATUS_UNHEALTHY,
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
  return health.status === HealthStatus.HEALTH_STATUS_HEALTHY;
}

export function createDatabaseHealthDependency(
  connected: boolean,
  responseTimeMs?: number
): HealthCheckDependency {
  return createHealthDependency(
    "database",
    connected
      ? HealthStatus.HEALTH_STATUS_HEALTHY
      : HealthStatus.HEALTH_STATUS_UNHEALTHY,
    connected ? "Connected" : "Disconnected",
    responseTimeMs
  );
}

export function createRabbitMQHealthDependency(
  connected: boolean,
  responseTimeMs?: number
): HealthCheckDependency {
  return createHealthDependency(
    "rabbitmq",
    connected
      ? HealthStatus.HEALTH_STATUS_HEALTHY
      : HealthStatus.HEALTH_STATUS_UNHEALTHY,
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
      ? HealthStatus.HEALTH_STATUS_HEALTHY
      : HealthStatus.HEALTH_STATUS_UNHEALTHY,
    connected ? "Connected" : "Disconnected",
    responseTimeMs
  );
}
