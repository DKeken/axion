import { type RequestMetadata, RequestMetadataSchema } from "@axion/contracts";
import { create } from "@bufbuild/protobuf";
import { timestampNow } from "@bufbuild/protobuf/wkt";
import type { UserSession } from "@thallesp/nestjs-better-auth";

/**
 * Convert Better Auth session to Axion request metadata
 */
export function sessionToMetadata(
  session: UserSession | null | undefined
): RequestMetadata | null {
  if (!session?.user?.id) {
    return null;
  }

  return create(RequestMetadataSchema, {
    userId: session.user.id,
    sessionId: session.session.id || "",
    requestId: "",
    timestamp: timestampNow(),
  });
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
  requestId?: string
): RequestMetadata | null {
  const userId = getUserIdFromSession(session);

  if (!session?.session?.id) {
    return null;
  }

  if (!userId) {
    return null;
  }

  return create(RequestMetadataSchema, {
    userId,
    sessionId: session.session.id || "",
    requestId: requestId || "",
    timestamp: timestampNow(),
  });
}
