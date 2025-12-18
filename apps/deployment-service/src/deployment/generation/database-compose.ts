import { DatabaseType, type Node } from "@axion/contracts";

import type { DatabaseServiceConfig } from "@/deployment/schemas/compose.schema";

export type DatabaseServiceGeneratorWarning = {
  message: string;
  nodeId: string;
  databaseType: DatabaseType;
};

export function resolveDatabaseType(value: unknown): DatabaseType {
  if (value === DatabaseType.DATABASE_TYPE_POSTGRESQL) {
    return DatabaseType.DATABASE_TYPE_POSTGRESQL;
  }
  if (value === DatabaseType.DATABASE_TYPE_MYSQL) {
    return DatabaseType.DATABASE_TYPE_MYSQL;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["postgres", "postgresql", "pg"].includes(normalized)) {
      return DatabaseType.DATABASE_TYPE_POSTGRESQL;
    }
    if (["mysql"].includes(normalized)) {
      return DatabaseType.DATABASE_TYPE_MYSQL;
    }
  }

  // Default
  return DatabaseType.DATABASE_TYPE_POSTGRESQL;
}

export function resolveConnectionName(node: Node): string {
  return (
    node.data?.config?.["connectionName"] ||
    node.data?.serviceName ||
    `db-${node.id.slice(0, 8)}`
  );
}

export function resolveDatabaseName(node: Node, projectId: string): string {
  return node.data?.config?.["database"] || `axion_${projectId.slice(0, 8)}`;
}

export function resolveDatabaseUser(node: Node): string {
  return node.data?.config?.["user"] || "axion";
}

export function resolveDatabasePassword(node: Node): string {
  return node.data?.config?.["password"] || "axion_password";
}

export function generateDatabaseEnvVars(
  dbName: string,
  dbType: DatabaseType,
  dbHost: string,
  dbDatabase: string,
  dbUser: string,
  dbPassword: string
): Record<string, string> {
  const dbPort = dbType === DatabaseType.DATABASE_TYPE_MYSQL ? "3306" : "5432";
  const connectionString =
    dbType === DatabaseType.DATABASE_TYPE_MYSQL
      ? `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbDatabase}`
      : `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbDatabase}`;

  return {
    [`DATABASE_URL_${dbName.toUpperCase()}`]: connectionString,
  };
}

function generatePostgreSQLService(
  connectionName: string,
  dbName: string,
  dbUser: string,
  dbPassword: string
): DatabaseServiceConfig {
  const volumeName = `${connectionName}_data`;
  return {
    name: connectionName,
    volume: volumeName,
    service: {
      image: "postgres:16-alpine",
      container_name: `${connectionName}-container`,
      environment: {
        POSTGRES_USER: dbUser,
        POSTGRES_PASSWORD: dbPassword,
        POSTGRES_DB: dbName,
        POSTGRES_INITDB_ARGS: `-U ${dbUser}`,
      },
      volumes: [`${volumeName}:/var/lib/postgresql/data`],
      networks: ["default"],
      healthcheck: {
        test: ["CMD-SHELL", "pg_isready -U postgres || pg_isready -U axion"],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
      restart: "unless-stopped",
    },
  };
}

function generateMySQLService(
  connectionName: string,
  dbName: string,
  dbUser: string,
  dbPassword: string
): DatabaseServiceConfig {
  const volumeName = `${connectionName}_data`;
  return {
    name: connectionName,
    volume: volumeName,
    service: {
      image: "mysql:8.0",
      container_name: `${connectionName}-container`,
      environment: {
        MYSQL_ROOT_PASSWORD: dbPassword,
        MYSQL_DATABASE: dbName,
        MYSQL_USER: dbUser,
        MYSQL_PASSWORD: dbPassword,
      },
      volumes: [`${volumeName}:/var/lib/mysql`],
      networks: ["default"],
      healthcheck: {
        test: ["CMD", "mysqladmin", "ping", "-h", "localhost"],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
      restart: "unless-stopped",
    },
  };
}

/**
 * Pure database compose generator.
 *
 * - Does NOT require Nest DI.
 * - You can pass warn callback to log unsupported DB types.
 */
export function generateDatabaseServiceConfig(
  node: Node,
  projectId: string,
  warn?: (warning: DatabaseServiceGeneratorWarning) => void
): DatabaseServiceConfig | null {
  const dbType = resolveDatabaseType(node.data?.config?.["databaseType"]);
  const connectionName = resolveConnectionName(node);
  const dbName = resolveDatabaseName(node, projectId);
  const dbUser = resolveDatabaseUser(node);
  const dbPassword = resolveDatabasePassword(node);

  if (dbType === DatabaseType.DATABASE_TYPE_POSTGRESQL) {
    return generatePostgreSQLService(
      connectionName,
      dbName,
      dbUser,
      dbPassword
    );
  }

  if (dbType === DatabaseType.DATABASE_TYPE_MYSQL) {
    return generateMySQLService(connectionName, dbName, dbUser, dbPassword);
  }

  warn?.({
    message: `Unsupported database type: ${dbType} for node ${node.id}`,
    nodeId: node.id,
    databaseType: dbType,
  });

  return null;
}
