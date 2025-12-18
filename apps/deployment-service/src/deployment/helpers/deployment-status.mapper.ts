import type { ServiceDeploymentStatus as DeploymentServiceDeploymentStatus } from "@axion/contracts";
import type { ServiceDeploymentStatus as RunnerServiceDeploymentStatus } from "@axion/contracts/generated/runner-agent/deployment";

export type DbServiceDeploymentStatus = Omit<
  DeploymentServiceDeploymentStatus,
  "status"
> & {
  status: string;
};

/**
 * Map RunnerAgent service statuses into DeploymentService DB-compatible shape.
 *
 * Note: RunnerAgent schema currently doesn't provide `nodeId`/`serverId`.
 * We use minimal safe fallbacks.
 */
export function mapRunnerServiceStatusesToDb(
  statuses: RunnerServiceDeploymentStatus[] | undefined
): DbServiceDeploymentStatus[] {
  if (!statuses || statuses.length === 0) return [];

  return statuses.map((s) => ({
    serviceId: s.serviceId || "",
    nodeId: s.serviceId || "",
    serviceName: s.serviceName || "",
    serverId: "",
    errorMessage: s.errorMessage || "",
    deployedAt: s.deployedAt || 0,
    status: s.status ? String(s.status) : "unknown",
  }));
}
