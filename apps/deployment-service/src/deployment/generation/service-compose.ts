import { type GenerationResult, type Node } from "@axion/contracts";

import {
  generateDatabaseEnvVars,
  resolveConnectionName,
  resolveDatabaseName,
  resolveDatabasePassword,
  resolveDatabaseType,
  resolveDatabaseUser,
} from "@/deployment/generation/database-compose";
import type { ServiceComposeConfig } from "@/deployment/schemas/compose.schema";

export function generateServiceComposeConfig(
  result: GenerationResult,
  projectId: string,
  envVars: Record<string, string>,
  serviceDeps: string[],
  dbDependencies: string[],
  databaseNodes: Node[]
): ServiceComposeConfig {
  const serviceName = result.serviceName;
  const allDependencies = [...new Set([...serviceDeps, ...dbDependencies])];

  // Generate env vars for DB connections.
  const dbEnvVars: Record<string, string> = {};
  for (const dbName of dbDependencies) {
    const dbNode = databaseNodes.find(
      (n) => resolveConnectionName(n) === dbName
    );
    if (!dbNode) continue;

    const dbType = resolveDatabaseType(dbNode.data?.config?.["databaseType"]);
    const dbHost = dbName;
    const dbDatabase = resolveDatabaseName(dbNode, projectId);
    const dbUser = resolveDatabaseUser(dbNode);
    const dbPassword = resolveDatabasePassword(dbNode);

    Object.assign(
      dbEnvVars,
      generateDatabaseEnvVars(dbName, dbType, dbHost, dbDatabase, dbUser, dbPassword)
    );
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
