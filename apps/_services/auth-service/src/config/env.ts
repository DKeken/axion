import { parseTrustedOrigins } from "@axion/shared";
import { z } from "zod";

const DEFAULT_TRUSTED_ORIGINS = [
  "http://localhost:3000",
  "http://traefik.localhost",
  "https://traefik.localhost",
];

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().optional(),
  AUTH_DATABASE_URL: z.string().min(1),
  KAFKA_BROKERS: z.string().optional(),
  TRUSTED_ORIGINS: z.string().optional(),
  BETTER_AUTH_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(1).optional(),
});

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

export const env = (() => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables: ${formatZodError(parsed.error)}`
    );
  }

  const data = parsed.data;

  return Object.freeze({
    nodeEnv: data.NODE_ENV,
    port: data.PORT ?? 3010,
    authDatabaseUrl: data.AUTH_DATABASE_URL,
    kafkaBrokers: data.KAFKA_BROKERS,
    // Better Auth itself can read BETTER_AUTH_URL/BETTER_AUTH_SECRET from env,
    // but we keep it here for explicitness and future wiring.
    betterAuthUrl: data.BETTER_AUTH_URL,
    betterAuthSecret: data.BETTER_AUTH_SECRET,
    trustedOrigins: parseTrustedOrigins(
      data.TRUSTED_ORIGINS,
      DEFAULT_TRUSTED_ORIGINS
    ),
  });
})();
