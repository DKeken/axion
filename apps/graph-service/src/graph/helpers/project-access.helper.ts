import { createErrorResponse, createNotFoundError } from "@axion/contracts";
import {
  verifyResourceAccess,
  type AccessVerificationResult,
} from "@axion/shared";

import { type ProjectRepository } from "@/graph/repositories/project.repository";

// Simple UUID v4 regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Helper для проверки доступа к проекту
 * Использует общий паттерн из @axion/contracts
 */
export async function verifyProjectAccess(
  projectRepository: ProjectRepository,
  projectId: string,
  metadata: unknown
): Promise<AccessVerificationResult> {
  // Check if projectId is a valid UUID to avoid database errors
  if (!UUID_REGEX.test(projectId)) {
    return {
      success: false,
      response: createErrorResponse(createNotFoundError("Project", projectId)),
    };
  }

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
