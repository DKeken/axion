import { createDatabaseConnection } from "@axion/database";

/**
 * Creates a connection to the centralized auth database
 * Used by services to validate sessions via Better Auth
 *
 * @param authDatabaseUrl - Connection string for auth database (AUTH_DATABASE_URL env var)
 * @returns Database connection for Better Auth
 */
export function createAuthDatabaseConnection(authDatabaseUrl: string) {
  // We don't need the schema for session validation - Better Auth handles it
  const { db } = createDatabaseConnection(authDatabaseUrl, {});
  return db;
}
