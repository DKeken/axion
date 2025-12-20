import { createDatabaseConnection } from "@axion/database";

import * as schema from "./auth-schema.generated";

import { env } from "@/config/env";

const log = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(`[auth-service][db] ${message}`);
};

log("Creating auth database connection...");
const connectionStartTime = Date.now();

const { client, db } = createDatabaseConnection(env.authDatabaseUrl, schema);

const connectionTime = Date.now() - connectionStartTime;
log(
  `Auth database connection created in ${connectionTime}ms (lazy connection)`
);

export function getClient() {
  return client;
}

export { client, db };
export type AuthDatabase = typeof db;
