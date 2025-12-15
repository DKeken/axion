import {
  verifyResourceAccess,
  type AccessVerificationResult,
} from "@axion/shared";

import { type ClusterRepository } from "@/infrastructure/repositories/cluster.repository";

/**
 * Helper для проверки доступа к кластеру
 * Использует общий паттерн из @axion/shared
 */
export async function verifyClusterAccess(
  clusterRepository: ClusterRepository,
  clusterId: string,
  metadata: unknown
): Promise<AccessVerificationResult> {
  return verifyResourceAccess(
    {
      findById: (id) => clusterRepository.findById(id),
      getOwnerId: (cluster) => cluster.userId,
      resourceName: "Cluster",
    },
    clusterId,
    metadata
  );
}
