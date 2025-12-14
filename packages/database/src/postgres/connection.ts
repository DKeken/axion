import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * Create PostgreSQL connection using postgres.js
 */
export function createPostgresConnection(connectionString: string) {
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return postgres(connectionString);
}

/**
 * Create Drizzle instance with schema
 */
export function createDrizzleInstance<T extends Record<string, unknown>>(
  client: postgres.Sql,
  schema: T
) {
  return drizzle(client, { schema });
}

/**
 * Factory function to create database connection and drizzle instance
 */
export function createDatabaseConnection<T extends Record<string, unknown>>(
  connectionString: string,
  schema: T
) {
  const client = createPostgresConnection(connectionString);
  const db = createDrizzleInstance(client, schema);
  return { client, db };
}
