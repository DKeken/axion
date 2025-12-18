import { type GenerationResult, type Node } from "@axion/contracts";
import { Injectable } from "@nestjs/common";

import type { ServiceComposeConfig } from "@/deployment/schemas/compose.schema";
import { DatabaseServiceGeneratorService } from "@/deployment/services/database-service-generator.service";

/**
 * Service Compose Generator
 * Генерирует конфигурацию сервисов для docker-compose
 */
@Injectable()
export class ServiceComposeGeneratorService {
  constructor(
    private readonly databaseServiceGenerator: DatabaseServiceGeneratorService
  ) {}

  /**
   * Генерирует конфигурацию сервиса для docker-compose
   */
  generateServiceConfig(
    result: GenerationResult,
    projectId: string,
    envVars: Record<string, string>,
    serviceDeps: string[],
    dbDependencies: string[],
    databaseNodes: Node[]
  ): ServiceComposeConfig {
    const serviceName = result.serviceName;
    const allDependencies = [...new Set([...serviceDeps, ...dbDependencies])];

    // Генерируем переменные окружения для подключения к БД
    const dbEnvVars: Record<string, string> = {};
    for (const dbName of dbDependencies) {
      const dbNode = databaseNodes.find(
        (n) => this.databaseServiceGenerator.resolveConnectionName(n) === dbName
      );
      if (dbNode) {
        const dbType = this.databaseServiceGenerator.resolveDatabaseType(
          dbNode.data?.config?.["databaseType"]
        );
        const dbHost = dbName;
        const dbDatabase = this.databaseServiceGenerator.resolveDatabaseName(
          dbNode,
          projectId
        );
        const dbUser = this.databaseServiceGenerator.resolveDatabaseUser(dbNode);
        const dbPassword =
          this.databaseServiceGenerator.resolveDatabasePassword(dbNode);

        Object.assign(
          dbEnvVars,
          this.databaseServiceGenerator.generateDatabaseEnvVars(
            dbName,
            dbType,
            dbHost,
            dbDatabase,
            dbUser,
            dbPassword
          )
        );
      }
    }

    return {
      build: {
        context: `.`,
        dockerfile: `Dockerfile.${serviceName}`,
      },
      container_name: `${serviceName}-container`,
      restart: "unless-stopped",
      environment: {
        ...envVars,
        ...dbEnvVars,
        NODE_ENV: "production",
        SERVICE_NAME: serviceName,
        PROJECT_ID: projectId,
      },
      networks: ["default"],
      healthcheck: {
        test: ["CMD", "curl", "-f", "http://localhost:3000/health"],
        interval: "30s",
        timeout: "10s",
        retries: 3,
        start_period: "40s",
      },
      depends_on:
        allDependencies.length > 0
          ? allDependencies.reduce(
              (acc, dep) => {
                acc[dep] = { condition: "service_healthy" };
                return acc;
              },
              {} as Record<string, { condition: string }>
            )
          : undefined,
    };
  }
}
