import {
  verifyResourceAccess,
  type AccessVerificationResult,
} from "@axion/shared";

import { type ProjectRepository } from "@/graph/repositories/project.repository";

/**
 * Helper для проверки доступа к проекту
 * Использует общий паттерн из @axion/contracts
 */
export async function verifyProjectAccess(
  projectRepository: ProjectRepository,
  projectId: string,
  metadata: unknown
): Promise<AccessVerificationResult> {
  return verifyResourceAccess(
    {
      findById: (id) => projectRepository.findById(id),
      getOwnerId: (project) => project.userId,
      resourceName: "Project",
    },
    projectId,
    metadata
  );
}
