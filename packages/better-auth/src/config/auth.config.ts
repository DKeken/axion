import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Better Auth configuration options
 */
export interface BetterAuthConfigOptions {
  /**
   * Database instance (Drizzle)
   */
  database: NodePgDatabase<Record<string, unknown>>;
  /**
   * Base path for auth endpoints (default: /api/auth)
   */
  basePath?: string;
  /**
   * Trusted origins for CORS
   */
  trustedOrigins?: string[];
  /**
   * Enable bearer token plugin (default: true)
   */
  enableBearer?: boolean;
  /**
   * Additional Better Auth options
   */
  options?: Partial<BetterAuthOptions>;
}

/**
 * Create Better Auth instance with Drizzle adapter
 */
export function createBetterAuth(
  config: BetterAuthConfigOptions
): ReturnType<typeof betterAuth> {
  const {
    database,
    basePath = "/api/auth",
    trustedOrigins = [],
    enableBearer = true,
    options = {},
  } = config;

  const plugins = [];
  if (enableBearer) {
    plugins.push(bearer());
  }

  const authConfig = {
    database: drizzleAdapter(database, {
      provider: "pg",
    }),
    basePath,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
    },
    plugins,
    hooks: {}, // Required for @Hook decorators
    ...options,
  };

  // Ensure hooks is always defined
  if (!authConfig.hooks) {
    authConfig.hooks = {};
  }

  return betterAuth(authConfig);
}
