/**
 * Bootstrap helper for NestJS microservices
 * Reduces boilerplate in main.ts by providing common setup patterns
 */

import type { INestApplication } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import type { MicroserviceOptions } from "@nestjs/microservices";
import { createKafkaServerOptions } from "@axion/shared";
import { setupHttpContractLayer } from "../http/setup-http";

import { setupSwagger, type SwaggerOptions } from "../swagger/setup-swagger";
import { setupGracefulShutdown } from "./graceful-shutdown";

export interface BootstrapOptions {
  /**
   * Service name (from @axion/contracts)
   */
  serviceName: string;
  /**
   * HTTP port to listen on (overrides defaultPort)
   */
  port?: number;
  /**
   * Default port for HTTP server
   */
  defaultPort?: number;
  /**
   * Kafka brokers (from env or provided)
   */
  kafkaBrokers?: string;
  /**
   * Whether Kafka is optional (default: true)
   * If true, service will continue even if Kafka fails to start
   */
  kafkaOptional?: boolean;
  /**
   * Swagger/OpenAPI options (optional)
   * If provided, Swagger documentation will be enabled
   */
  swagger?: SwaggerOptions | boolean;
}

/**
 * Bootstrap a NestJS microservice with Kafka and HTTP server
 *
 * @example
 * ```typescript
 * import { bootstrapMicroservice } from "@axion/nestjs-common";
 * import { GRAPH_SERVICE_NAME } from "@axion/contracts";
 * import { AppModule } from "./app.module";
 *
 * bootstrapMicroservice(AppModule, {
 *   serviceName: GRAPH_SERVICE_NAME,
 *   defaultPort: 3001,
 * });
 * ```
 */
export async function bootstrapMicroservice(
  AppModule: unknown,
  options: BootstrapOptions
): Promise<INestApplication> {
  const logger = new Logger("Bootstrap");
  const { NestFactory } = await import("@nestjs/core");

  logger.log(`Creating NestJS application for ${options.serviceName}...`);
  const app = await NestFactory.create(AppModule as { new (): unknown });
  logger.log(`NestJS application created for ${options.serviceName}`);

  // Global HTTP layer for public API endpoints (contract → HTTP status, etc.)
  setupHttpContractLayer(app);

  // Setup Swagger/OpenAPI documentation (if enabled)
  if (options.swagger) {
    const swaggerOptions =
      typeof options.swagger === "boolean"
        ? {
            serviceName: options.serviceName,
            apiVersion: "v1",
            description: `${options.serviceName} API`,
          }
        : options.swagger;

    setupSwagger(app, swaggerOptions);
    logger.log(
      `Swagger documentation available at http://localhost:${options.port ?? options.defaultPort ?? 3000}/api-docs`
    );
  }

  // Setup Kafka microservice
  const kafkaBrokers = options.kafkaBrokers;
  const kafkaOptional = options.kafkaOptional !== false; // default true

  if (kafkaBrokers) {
    try {
      logger.log(`Connecting to Kafka at ${kafkaBrokers}...`);
      const kafkaOptions = createKafkaServerOptions(
        options.serviceName,
        kafkaBrokers
      );
      logger.log(`Kafka options created for service: ${options.serviceName}`);
      app.connectMicroservice<MicroserviceOptions>(kafkaOptions);
      logger.log("Microservice connected, starting all microservices...");
      await app.startAllMicroservices();
      logger.log("Kafka microservice started");
    } catch (error) {
      logger.error("Failed to start Kafka microservice:", error);
      if (!kafkaOptional) {
        throw error;
      }
      logger.warn("Continuing without Kafka - HTTP server will still start");
    }
  } else {
    logger.warn(
      "Kafka brokers not provided - starting without Kafka microservice"
    );
  }

  // Setup graceful shutdown
  setupGracefulShutdown(app);

  // Start HTTP server
  const port = options.port ?? options.defaultPort ?? 3000;

  await app.listen(port);
  logger.log(`${options.serviceName} HTTP server listening on port ${port}`);

  return app;
}
