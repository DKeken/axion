import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/database/auth-schema.generated.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL || "",
  },
});
