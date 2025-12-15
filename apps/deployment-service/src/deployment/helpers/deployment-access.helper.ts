import {
  verifyResourceAccess,
  type AccessVerificationResult,
} from "@axion/shared";

import { type DeploymentRepository } from "@/deployment/repositories/deployment.repository";

/**
 * Helper для проверки доступа к деплою
 * Использует общий паттерн из @axion/shared
 */
export async function verifyDeploymentAccess(
  deploymentRepository: DeploymentRepository,
  deploymentId: string,
  metadata: unknown
): Promise<AccessVerificationResult> {
  return verifyResourceAccess(
    {
      findById: (id) => deploymentRepository.findById(id),
      getOwnerId: (deployment) => {
        // Для деплоя нужно получить userId через projectId
        // Пока возвращаем projectId как ownerId (нужно будет доработать через Graph Service)
        return deployment.projectId;
      },
      resourceName: "Deployment",
    },
    deploymentId,
    metadata
  );
}
