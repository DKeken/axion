/**
 * Service status utilities
 */

import { ServiceStatus } from "../../generated/graph/graph_pb";
export { ServiceStatus };

/**
 * Map service status to database string
 */
export function serviceStatusToDbString(status: ServiceStatus): string {
  switch (status) {
    case ServiceStatus.PENDING:
      return "pending";
    case ServiceStatus.RUNNING:
      return "running";
    case ServiceStatus.STOPPED:
      return "stopped";
    case ServiceStatus.ERROR:
      return "error";
    default:
      return "unknown";
  }
}

/**
 * Map service status from database string
 */
export function mapServiceStatus(dbStatus: string): ServiceStatus {
  const normalized = dbStatus.toLowerCase();
  switch (normalized) {
    case "pending":
      return ServiceStatus.PENDING;
    case "running":
      return ServiceStatus.RUNNING;
    case "stopped":
      return ServiceStatus.STOPPED;
    case "error":
      return ServiceStatus.ERROR;
    default:
      return ServiceStatus.UNSPECIFIED;
  }
}

/**
 * Check if service is running
 */
export function isServiceRunning(status: ServiceStatus): boolean {
  return status === ServiceStatus.RUNNING;
}

/**
 * Check if service has error
 */
export function hasServiceError(status: ServiceStatus): boolean {
  return status === ServiceStatus.ERROR;
}
