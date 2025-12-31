import type { INestApplication } from "@nestjs/common";
import { Logger } from "@nestjs/common";

/**
 * Setup graceful shutdown for NestJS application
 * Handles SIGTERM and SIGINT signals to gracefully close:
 * - HTTP server
 * - Kafka consumers
 * - BullMQ workers
 * - Database connections
 */
export function setupGracefulShutdown(
  app: INestApplication
): (signal?: string) => Promise<void> {
  const logger = new Logger("GracefulShutdown");

  const shutdown = async (signal: string = "MANUAL") => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);

    try {
      // Give time for in-flight requests to complete (optional timeout)
      const shutdownTimeout = 30000; // 30 seconds
      const shutdownPromise = (async () => {
        // Close all microservices first (Kafka consumers, BullMQ workers)
        // This stops accepting new work
        const microservices = app.getMicroservices();
        for (const microservice of microservices) {
          try {
            await microservice.close();
          } catch (error) {
            logger.warn("Error closing microservice:", error);
          }
        }
        logger.log("Microservices closed");

        // Close HTTP server (stops accepting new connections)
        await app.close();
        logger.log("HTTP server closed");

        logger.log("Graceful shutdown completed");
      })();

      // Wait for shutdown with timeout
      await Promise.race([
        shutdownPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Shutdown timeout")),
            shutdownTimeout
          )
        ),
      ]);

      process.exit(0);
    } catch (error) {
      logger.error("Error during graceful shutdown:", error);
      // Force exit after timeout or error
      process.exit(1);
    }
  };

  // Handle termination signals
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception:", error);
    shutdown("uncaughtException").catch(() => {
      process.exit(1);
    });
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled rejection at:", promise, "reason:", reason);
    shutdown("unhandledRejection").catch(() => {
      process.exit(1);
    });
  });

  return shutdown;
}
