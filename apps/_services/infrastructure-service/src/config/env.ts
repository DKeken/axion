import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3004"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  KAFKA_BROKERS: z.string().optional(),
  MAX_SERVERS_PER_USER: z.string().default("10"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten());
  throw new Error("Invalid environment variables");
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: Number.parseInt(parsed.data.PORT, 10),
  databaseUrl: parsed.data.DATABASE_URL,
  redisUrl: parsed.data.REDIS_URL,
  kafkaBrokers: parsed.data.KAFKA_BROKERS,
  maxServersPerUser: Number.parseInt(parsed.data.MAX_SERVERS_PER_USER, 10),
} as const;

