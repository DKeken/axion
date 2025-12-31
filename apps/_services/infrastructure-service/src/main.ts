import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { createServer } from "node:http";
import { createKafkaServerOptions } from "@axion/shared/nest";
import type { MicroserviceOptions } from "@nestjs/microservices";
import {
  createConnectRpcHandler,
  logConnectRpcStartup,
} from "@axion/nestjs-common";
import { AppModule } from "./app.module";
import { InfrastructureController } from "./infrastructure/infrastructure.controller";
import { INFRASTRUCTURE_SERVICE_NAME } from "./constants/patterns";
import { env } from "./config/env";

const logger = new Logger("Bootstrap");

/**
 * Bootstrap infrastructure-service with Connect-RPC and optional Kafka
 *
 * Features:
 * - Connect-RPC server for type-safe RPC calls
 * - Optional Kafka transport for message-based communication
 * - Health check endpoint
 */
async function bootstrap() {
  logger.log("Creating NestJS application...");
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  });

  // Setup Kafka microservice (optional)
  if (env.kafkaBrokers) {
    try {
      logger.log(`Connecting to Kafka at ${env.kafkaBrokers}...`);
      const kafkaOptions = createKafkaServerOptions(
        INFRASTRUCTURE_SERVICE_NAME,
        env.kafkaBrokers
      );
      app.connectMicroservice<MicroserviceOptions>(kafkaOptions);
      await app.startAllMicroservices();
      logger.log("Kafka microservice started");
    } catch (error) {
      logger.error("Failed to start Kafka microservice:", error);
      logger.warn(
        "Continuing without Kafka - Connect-RPC server will still start"
      );
    }
  } else {
    logger.warn("Kafka brokers not configured - starting without Kafka");
  }

  // Get controller for Connect-RPC
  const infrastructureController = app.get(InfrastructureController);

  // Create HTTP server with Connect-RPC
  const connectRpcHandler = createConnectRpcHandler(
    [infrastructureController],
    {
      cors: true,
      healthCheck: true,
      healthCheckPath: "/health",
    }
  );

  const server = createServer(connectRpcHandler);

  // Start HTTP server
  server.listen(env.port, "0.0.0.0", () => {
    logger.log(
      `Infrastructure Service HTTP server listening on port ${env.port} (0.0.0.0)`
    );
    logConnectRpcStartup(env.port, INFRASTRUCTURE_SERVICE_NAME);
    logger.log(`Health check: http://localhost:${env.port}/health`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.log("\nShutting down gracefully...");

    try {
      server.close(() => {
        logger.log("HTTP server closed");
      });

      await app.close();
      logger.log("NestJS application closed");

      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return app;
}

bootstrap().catch((error) => {
  logger.error("Failed to start infrastructure-service:", error);
  process.exit(1);
});
