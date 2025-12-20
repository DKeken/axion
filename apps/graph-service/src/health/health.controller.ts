import { HealthStatus } from "@axion/contracts";
import { TypedRoute } from "@nestia/core";
import { Controller, Logger } from "@nestjs/common";
import { MessagePattern, Ctx } from "@nestjs/microservices";
import type { KafkaContext } from "@nestjs/microservices";

import { getClient } from "@/database/connection";

@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor() {
    this.logger.log("HealthController initialized");
  }

  /**
   * HTTP health check endpoint
   */
  @TypedRoute.Get("health")
  async httpHealthCheck() {
    try {
      const client = getClient();
      const startTime = Date.now();
      await client`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: "ok",
        info: {
          database: {
            status: "up",
            responseTime: `${responseTime}ms`,
          },
        },
      };
    } catch (error) {
      this.logger.error("Database health check failed", error);
      return {
        status: "error",
        error: {
          database: {
            status: "down",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        },
      };
    }
  }

  /**
   * Kafka health check handler
   */
  @MessagePattern("graph-service.healthCheck")
  async healthCheck(@Ctx() _context: KafkaContext) {
    this.logger.log("Received health check request via Kafka");

    try {
      const client = getClient();
      const startTime = Date.now();
      await client`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        health: {
          status: HealthStatus.HEALTH_STATUS_HEALTHY,
          service_name: "graph-service",
          timestamp: Date.now(),
          details: {},
          dependencies: [
            {
              name: "database",
              status: HealthStatus.HEALTH_STATUS_HEALTHY,
              message: `Connected - ${responseTime}ms`,
            },
          ],
        },
      };
    } catch (error) {
      return {
        health: {
          status: HealthStatus.HEALTH_STATUS_UNHEALTHY,
          service_name: "graph-service",
          timestamp: Date.now(),
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
          dependencies: [
            {
              name: "database",
              status: HealthStatus.HEALTH_STATUS_UNHEALTHY,
              message: error instanceof Error ? error.message : "Unknown error",
            },
          ],
        },
      };
    }
  }
}
