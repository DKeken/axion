import { createDatabaseConnection } from "@axion/database";
import { env } from "@/config/env";
import * as schema from "./schema";

/**
 * Database connection for infrastructure-service
 */
export const { client, db } = createDatabaseConnection(env.databaseUrl, schema);

