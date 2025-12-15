import {
  verifyResourceAccess,
  type AccessVerificationResult,
} from "@axion/shared";

import { type ServerRepository } from "@/infrastructure/repositories/server.repository";

/**
 * Helper для проверки доступа к серверу
 * Использует общий паттерн из @axion/shared
 */
export async function verifyServerAccess(
  serverRepository: ServerRepository,
  serverId: string,
  metadata: unknown
): Promise<AccessVerificationResult> {
  return verifyResourceAccess(
    {
      findById: (id) => serverRepository.findById(id),
      getOwnerId: (server) => server.userId,
      resourceName: "Server",
    },
    serverId,
    metadata
  );
}
