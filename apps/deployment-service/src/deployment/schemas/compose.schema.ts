import { z } from "zod";

/**
 * Zod схемы для Docker Compose структур
 * Типы выводятся через z.infer<typeof schema>
 */

/**
 * Healthcheck схема для сервисов приложений
 */
const serviceHealthcheckSchema = z.object({
  test: z.array(z.string()),
  interval: z.string(),
  timeout: z.string(),
  retries: z.number(),
  start_period: z.string(),
});

/**
 * Healthcheck схема для сервисов БД
 */
const databaseHealthcheckSchema = z.object({
  test: z.union([z.string(), z.array(z.string())]),
  interval: z.string(),
  timeout: z.string(),
  retries: z.number(),
});

/**
 * Схема для сервисов приложений (build-based)
 */
export const serviceComposeSchema = z.object({
  build: z.object({
    context: z.string(),
    dockerfile: z.string(),
  }),
  container_name: z.string(),
  restart: z.string(),
  environment: z.record(z.string(), z.string()),
  networks: z.array(z.string()),
  healthcheck: serviceHealthcheckSchema,
  depends_on: z
    .record(z.string(), z.object({ condition: z.string() }))
    .optional(),
});

/**
 * Схема для сервисов БД (image-based)
 */
export const databaseServiceSchema = z.object({
  image: z.string(),
  container_name: z.string(),
  environment: z.record(z.string(), z.string()),
  volumes: z.array(z.string()),
  networks: z.array(z.string()),
  healthcheck: databaseHealthcheckSchema,
  restart: z.string(),
});

/**
 * Схема для полной конфигурации сервиса БД (с name и volume)
 */
export const databaseServiceConfigSchema = z.object({
  name: z.string(),
  service: databaseServiceSchema,
  volume: z.string(),
});

/**
 * Схема для Docker Compose спецификации
 */
export const composeSpecSchema = z.object({
  version: z.literal("3.8"),
  services: z.record(
    z.string(),
    z.union([serviceComposeSchema, databaseServiceSchema])
  ),
  networks: z.record(z.string(), z.object({ driver: z.string() })),
  volumes: z.record(z.string(), z.object({}).passthrough()).optional(),
});

/**
 * Типы, выведенные из схем
 */
export type ServiceComposeConfig = z.infer<typeof serviceComposeSchema>;
export type DatabaseServiceConfig = z.infer<typeof databaseServiceConfigSchema>;
export type ComposeService = z.infer<
  typeof composeSpecSchema
>["services"][string];
export type ComposeSpec = z.infer<typeof composeSpecSchema>;
