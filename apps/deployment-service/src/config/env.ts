import { parseTrustedOrigins } from "@axion/shared";
import { z } from "zod";

const DEFAULT_TRUSTED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://traefik.localhost",
  "https://traefik.localhost",
];

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).optional(),
  KAFKA_BROKERS: z.string().min(1).optional(),
  TRUSTED_ORIGINS: z.string().optional(),
  MAX_DEPLOYMENTS_PER_PROJECT: z.coerce.number().int().positive().optional(),
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
    port: data.PORT ?? 3005,
    databaseUrl: data.DATABASE_URL,
    redisUrl: data.REDIS_URL,
    kafkaBrokers: data.KAFKA_BROKERS,
    maxDeploymentsPerProject: data.MAX_DEPLOYMENTS_PER_PROJECT,
    trustedOrigins: parseTrustedOrigins(
      data.TRUSTED_ORIGINS,
      DEFAULT_TRUSTED_ORIGINS
    ),
  });
})();
