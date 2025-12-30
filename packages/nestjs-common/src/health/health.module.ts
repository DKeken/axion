/**
 * Universal Health Module for NestJS microservices
 * Provides health check endpoints with database connectivity check
 * Reduces boilerplate by eliminating need to create health modules for each service
 */

import {
  Module,
  Controller,
  Get,
  Logger,
  type DynamicModule,
  Inject,
} from "@nestjs/common";
import { MessagePattern, Ctx } from "@nestjs/microservices";
import type { KafkaContext } from "@nestjs/microservices";

const HEALTH_OPTIONS_TOKEN = Symbol("HEALTH_OPTIONS");

export type HealthCheckOptions = {
  /**
   * Service name for health check responses
   */
  serviceName: string;
  /**
   * Database client getter function
   * Should return a database client that can execute queries
   * Supports both postgres tagged template syntax and query methods
   */
  getDatabaseClient?: () =>
    | {
        query?: (sql: unknown) => Promise<unknown>;
        sql?: (
          strings: TemplateStringsArray,
          ...values: unknown[]
        ) => Promise<unknown>;
      }
    | ((
        strings: TemplateStringsArray,
        ...values: unknown[]
      ) => Promise<unknown>)
    | null;
  /**
   * Additional health checks
   */
  additionalChecks?: () => Promise<Record<string, unknown>>;
}

/**
 * Universal Health Controller
 */
@Controller()
class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly serviceName: string;
  private readonly getDatabaseClient?: HealthCheckOptions["getDatabaseClient"];
  private readonly additionalChecks?: HealthCheckOptions["additionalChecks"];

  constructor(@Inject(HEALTH_OPTIONS_TOKEN) options: HealthCheckOptions) {
    this.serviceName = options.serviceName;
    this.getDatabaseClient = options.getDatabaseClient;
    this.additionalChecks = options.additionalChecks;
  }

  /**
   * HTTP health check endpoint
   */
  @Get("health")
  async httpHealthCheck() {
    try {
      const checks: Record<string, unknown> = {};

      // Database check
      if (this.getDatabaseClient) {
        const client = this.getDatabaseClient();
        if (client) {
          const startTime = Date.now();
          // Try different client APIs
          if (typeof client === "function") {
            // Direct tagged template function (postgres client)
            await (client as (
              strings: TemplateStringsArray,
              ...values: unknown[]
            ) => Promise<unknown>)`SELECT 1`;
          } else if (
            typeof (client as { sql?: unknown }).sql === "function"
          ) {
            // Client with sql method
            await (
              client as {
                sql: (
                  strings: TemplateStringsArray,
                  ...values: unknown[]
                ) => Promise<unknown>;
              }
            ).sql`SELECT 1`;
          } else if (
            typeof (client as { query?: unknown }).query === "function"
          ) {
            // Client with query method
            await (
              client as { query: (sql: unknown) => Promise<unknown> }
            ).query("SELECT 1");
          }
          const responseTime = Date.now() - startTime;
          checks.database = {
            status: "up",
            responseTime: `${responseTime}ms`,
          };
        }
      }

      // Additional checks
      if (this.additionalChecks) {
        const additional = await this.additionalChecks();
        Object.assign(checks, additional);
      }

      return {
        status: "ok",
        info: checks,
      };
    } catch (error) {
      this.logger.error("Health check failed", error);
      return {
        status: "error",
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Kafka health check handler
   */
  @MessagePattern("health.check")
  async healthCheck(@Ctx() _context: KafkaContext) {
    this.logger.log("Received health check request via Kafka");

    try {
      const dependencies: Array<{
        name: string;
        status: string;
        message: string;
      }> = [];

      // Database check
      if (this.getDatabaseClient) {
        const client = this.getDatabaseClient();
        if (client) {
          const startTime = Date.now();
          try {
            // Try different client APIs
            if (typeof client === "function") {
              // Direct tagged template function (postgres client)
              await (client as (
                strings: TemplateStringsArray,
                ...values: unknown[]
              ) => Promise<unknown>)`SELECT 1`;
            } else if (
              typeof (client as { sql?: unknown }).sql === "function"
            ) {
              // Client with sql method
              await (
                client as {
                  sql: (
                    strings: TemplateStringsArray,
                    ...values: unknown[]
                  ) => Promise<unknown>;
                }
              ).sql`SELECT 1`;
            } else if (
              typeof (client as { query?: unknown }).query === "function"
            ) {
              // Client with query method
              await (
                client as { query: (sql: unknown) => Promise<unknown> }
              ).query("SELECT 1");
            }
            const responseTime = Date.now() - startTime;
            dependencies.push({
              name: "database",
              status: "HEALTH_STATUS_HEALTHY",
              message: `Connected - ${responseTime}ms`,
            });
          } catch (error) {
            dependencies.push({
              name: "database",
              status: "HEALTH_STATUS_UNHEALTHY",
              message: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      }

      // Additional checks
      const details: Record<string, unknown> = {};
      if (this.additionalChecks) {
        try {
          const additional = await this.additionalChecks();
          Object.assign(details, additional);
        } catch (error) {
          details.error =
            error instanceof Error ? error.message : "Unknown error";
        }
      }

      const hasUnhealthy = dependencies.some((d) =>
        d.status.includes("UNHEALTHY")
      );

      return {
        health: {
          status: hasUnhealthy
            ? "HEALTH_STATUS_UNHEALTHY"
            : "HEALTH_STATUS_HEALTHY",
          service_name: this.serviceName,
          timestamp: Date.now(),
          details,
          dependencies,
        },
      };
    } catch (error) {
      return {
        health: {
          status: "HEALTH_STATUS_UNHEALTHY",
          service_name: this.serviceName,
          timestamp: Date.now(),
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
          dependencies: [],
        },
      };
    }
  }
}

/**
 * Universal Health Module
 * Use this in your service's AppModule to add health checks
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     HealthModule.forRoot({
 *       serviceName: "graph-service",
 *       getDatabaseClient: () => getClient(),
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class HealthModule {
  static forRoot(options: HealthCheckOptions): DynamicModule {
    return {
      module: HealthModule,
      controllers: [HealthController],
      providers: [
        {
          provide: HEALTH_OPTIONS_TOKEN,
          useValue: options,
        },
      ],
    };
  }
}
