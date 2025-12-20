import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";

import { env } from "@/config/env";
import { db } from "@/database";

export const auth = betterAuth({
  // Better Auth reads BETTER_AUTH_SECRET / BETTER_AUTH_URL from env by default,
  // but we still pass basePath + trustedOrigins explicitly.
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  basePath: "/api/auth",
  trustedOrigins: env.trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer()],
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
});
