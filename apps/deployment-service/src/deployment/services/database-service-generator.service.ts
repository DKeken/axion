import { type Node, DatabaseType } from "@axion/contracts";
import { Injectable, Logger } from "@nestjs/common";

import type { DatabaseServiceConfig } from "@/deployment/schemas/compose.schema";

/**
 * Database Service Generator
 * Генерирует конфигурацию сервисов баз данных для docker-compose
 */
@Injectable()
export class DatabaseServiceGeneratorService {
  private readonly logger = new Logger(DatabaseServiceGeneratorService.name);

  /**
   * Генерирует конфигурацию сервиса базы данных
   */
  generate(node: Node, projectId: string): DatabaseServiceConfig | null {
    const dbType = this.resolveDatabaseType(
      node.data?.config?.["databaseType"]
    );
    const connectionName =
      node.data?.config?.["connectionName"] || `db-${node.id.slice(0, 8)}`;
    const dbName =
      node.data?.config?.["database"] || `axion_${projectId.slice(0, 8)}`;
    const dbUser = node.data?.config?.["user"] || "axion";
    const dbPassword = node.data?.config?.["password"] || "axion_password";

    if (dbType === DatabaseType.DATABASE_TYPE_POSTGRESQL) {
      return this.generatePostgreSQLService(
        connectionName,
        dbName,
        dbUser,
        dbPassword
      );
    }

    if (dbType === DatabaseType.DATABASE_TYPE_MYSQL) {
      return this.generateMySQLService(
        connectionName,
        dbName,
        dbUser,
        dbPassword
      );
    }

    this.logger.warn(
      `Unsupported database type: ${dbType} for node ${node.id}`
    );
    return null;
  }

  /**
   * Генерирует переменные окружения для подключения к БД
   */
  generateDatabaseEnvVars(
    dbName: string,
    dbType: DatabaseType,
    dbHost: string,
    dbDatabase: string,
    dbUser: string,
    dbPassword: string
  ): Record<string, string> {
    const dbPort =
      dbType === DatabaseType.DATABASE_TYPE_MYSQL ? "3306" : "5432";
    const connectionString =
      dbType === DatabaseType.DATABASE_TYPE_MYSQL
        ? `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbDatabase}`
        : `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbDatabase}`;

    return {
      [`DATABASE_URL_${dbName.toUpperCase()}`]: connectionString,
    };
  }

  private generatePostgreSQLService(
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

  private generateMySQLService(
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
   * Разрешает тип базы данных из значения (публичный метод для использования в других сервисах)
   */
  resolveDatabaseType(value: unknown): DatabaseType {
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

    return DatabaseType.DATABASE_TYPE_POSTGRESQL;
  }
}
