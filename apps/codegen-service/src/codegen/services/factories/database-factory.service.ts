import {
  type GraphData,
  type Node,
  NodeType,
  EdgeType,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService, handleServiceError } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { DatabaseNodeCodeGeneratorService } from "@/codegen/services/database-node-code-generator.service";
import type { DatabaseComponents } from "@/codegen/types/factory.types";

/**
 * Database Factory Service
 * Автоматически создает database компоненты (connection, schema, repository) из графа
 */
@Injectable()
export class DatabaseFactoryService extends BaseService {
  constructor(
    private readonly databaseNodeCodeGenerator: DatabaseNodeCodeGeneratorService
  ) {
    super(DatabaseFactoryService.name);
  }

  /**
   * Создает database компоненты для сервиса на основе database edges в графе
   * @param serviceNode - service node из графа
   * @param graph - полный граф проекта
   * @returns объект с сгенерированными файлами database компонентов
   */
  @CatchError({ operation: "creating database components" })
  async createDatabaseComponents(
    serviceNode: Node,
    graph: GraphData
  ): Promise<DatabaseComponents> {
    // Валидация типа ноды
    if (serviceNode.type !== NodeType.NODE_TYPE_SERVICE) {
      return handleServiceError(
        this.logger,
        "validating service node type",
        new Error(`Expected service node, got node type: ${serviceNode.type}`),
        {
          operation: "validating service node type",
          additional: {
            nodeId: serviceNode.id,
            nodeType: serviceNode.type,
          },
        }
      ) as never;
    }

    // Находим все database edges для этого сервиса
    const databaseEdges =
      graph.edges?.filter(
        (edge) =>
          edge.source === serviceNode.id &&
          edge.type === EdgeType.EDGE_TYPE_DATABASE
      ) || [];

    if (databaseEdges.length === 0) {
      this.logger.debug(
        `No database edges found for service ${serviceNode.id}`
      );
      return {
        connections: [],
        schemas: [],
        repositories: [],
      };
    }

    this.logger.log(
      `Creating database components for service ${serviceNode.id} (${databaseEdges.length} database connections)`
    );

    const connections: DatabaseComponents["connections"] = [];
    const schemas: DatabaseComponents["schemas"] = [];
    const repositories: DatabaseComponents["repositories"] = [];

    // Для каждой database edge находим database node и генерируем код
    for (const edge of databaseEdges) {
      const databaseNode = graph.nodes?.find(
        (n) => n.id === edge.target && n.type === NodeType.NODE_TYPE_DATABASE
      );

      if (!databaseNode) {
        this.logger.warn(
          `Database node not found for edge ${edge.id} (target: ${edge.target})`
        );
        continue;
      }

      try {
        // Получаем connection name из database node
        const connectionName =
          this.databaseNodeCodeGenerator.getConnectionNameFromNode(
            databaseNode
          );

        // Извлекаем entity name из service node
        const entityName = this.extractEntityName(serviceNode);
        const entityNameLower = this.extractEntityNameLower(serviceNode);
        const tableName = this.extractTableName(serviceNode);

        // Генерируем код для database node
        const dbCode =
          await this.databaseNodeCodeGenerator.generateDatabaseNodeCode(
            databaseNode,
            {
              connectionName,
              entityName,
              entityNameLower,
              tableName,
            }
          );

        connections.push({
          connectionName,
          code: dbCode.connection,
        });

        schemas.push({
          entityName,
          code: dbCode.schema,
        });

        repositories.push({
          entityName,
          code: dbCode.repository,
        });
      } catch (error) {
        this.logger.error(
          `Failed to generate database code for edge ${edge.id}`,
          error
        );
        // Продолжаем обработку других edges
        continue;
      }
    }

    return {
      connections,
      schemas,
      repositories,
    };
  }

  /**
   * Генерирует код для инициализации database в main.ts или app.module.ts
   */
  @CatchError({ operation: "generating database initialization code" })
  async generateDatabaseInitializationCode(
    connections: DatabaseComponents["connections"]
  ): Promise<string> {
    if (connections.length === 0) {
      return "// No database connections";
    }

    // Генерируем код для инициализации всех connections
    const initCode = connections
      .map((conn) => {
        return `// Initialize ${conn.connectionName} connection
const ${conn.connectionName}Connection = createDrizzleConnection(
  process.env.DATABASE_URL_${conn.connectionName.toUpperCase()} || process.env.DATABASE_URL
);`;
      })
      .join("\n\n");

    return initCode;
  }

  /**
   * Извлекает entity name из service node
   */
  private extractEntityName(serviceNode: Node): string {
    const nodeData = serviceNode.data as Record<string, unknown> | undefined;
    const serviceName = (nodeData?.name as string) || "Entity";

    // Преобразуем service name в PascalCase entity name
    return this.toPascalCase(serviceName);
  }

  /**
   * Извлекает entity name в camelCase
   */
  private extractEntityNameLower(serviceNode: Node): string {
    const entityName = this.extractEntityName(serviceNode);
    return entityName.charAt(0).toLowerCase() + entityName.slice(1);
  }

  /**
   * Извлекает table name из service node
   */
  private extractTableName(serviceNode: Node): string {
    const entityName = this.extractEntityName(serviceNode);
    // Преобразуем PascalCase в snake_case
    return this.toSnakeCase(entityName);
  }

  /**
   * Преобразует строку в PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(/[\s_-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  }

  /**
   * Преобразует строку в snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  }
}
