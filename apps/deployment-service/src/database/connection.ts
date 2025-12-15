import { createDatabaseConnection } from "@axion/database";
import { Logger } from "@nestjs/common";

import * as schema from "./schema";

const logger = new Logger("DatabaseConnection");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

logger.log("Creating database connection...");
const connectionStartTime = Date.now();

// Create database connection using shared utility
const { client, db } = createDatabaseConnection(connectionString, schema);

const connectionTime = Date.now() - connectionStartTime;
logger.log(
  `Database connection created in ${connectionTime}ms (lazy connection - actual connection will be established on first query)`
);

/**
 * Get database client for health checks
 * Returns client if available, otherwise throws error
 */
export function getClient() {
  return client;
}

export { client, db };
export type Database = typeof db;
