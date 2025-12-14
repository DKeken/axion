import type { UserSession } from "@thallesp/nestjs-better-auth";
import type { RequestMetadata } from "@axion/contracts";

/**
 * Convert Better Auth session to Axion request metadata
 */
export function sessionToMetadata(
  session: UserSession | null | undefined
): RequestMetadata | null {
  if (!session?.user?.id) {
    return null;
  }

  return {
    userId: session.user.id,
    projectId: "",
    requestId: "",
    timestamp: Date.now(),
  };
}

/**
 * Extract user ID from Better Auth session
 */
export function getUserIdFromSession(
  session: UserSession | null | undefined
): string | undefined {
  return session?.user?.id;
}

/**
 * Create request metadata from session with optional project ID
 */
export function createMetadataFromSession(
  session: UserSession | null | undefined,
  projectId?: string,
  requestId?: string
): RequestMetadata | null {
  const userId = getUserIdFromSession(session);
  if (!userId) {
    return null;
  }

  return {
    userId,
    ...(projectId && { projectId }),
    ...(requestId && { requestId }),
    timestamp: Date.now(),
  } as RequestMetadata;
}
