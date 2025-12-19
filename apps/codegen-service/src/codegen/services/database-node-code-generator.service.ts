import { type Node, NodeType } from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService, handleServiceError } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import {
  DEFAULT_CONNECTION_NAME,
  DEFAULT_DATABASE_TYPE,
  DEFAULT_ORM,
  TEMPLATE_PATHS,
} from "@/codegen/constants/template-engine.constants";
import { SchemaGeneratorService } from "@/codegen/services/schema-generator.service";
import { TemplateEngineService } from "@/codegen/services/template-engine.service";
import type {
  DatabaseCodeGenerationVariables,
  GeneratedDatabaseCode,
} from "@/codegen/types/template-engine.types";

/**
 * Database Node Code Generator Service
 * Генерирует код для database nodes: connection, schema, repository на основе ORM
 */
@Injectable()
export class DatabaseNodeCodeGeneratorService extends BaseService {
  constructor(
    private readonly templateEngine: TemplateEngineService,
    private readonly schemaGenerator: SchemaGeneratorService
  ) {
    super(DatabaseNodeCodeGeneratorService.name);
  }

  /**
   * Генерирует код для database node
   * @param node - database node из графа
   * @param variables - дополнительные переменные для подстановки
   * @returns объект с сгенерированными файлами
   */
  @CatchError({ operation: "generating database node code" })
  async generateDatabaseNodeCode(
    node: Node,
    variables: DatabaseCodeGenerationVariables = {}
  ): Promise<GeneratedDatabaseCode> {
    // Валидация типа ноды
    if (node.type !== NodeType.NODE_TYPE_DATABASE) {
      return handleServiceError(
        this.logger,
        "validating database node type",
        new Error(`Expected database node, got node type: ${node.type}`),
        {
          operation: "validating database node type",
          additional: {
            nodeId: node.id,
            nodeType: node.type,
          },
        }
      ) as never;
    }

    // ORM, connectionName и databaseType могут быть в config
    const orm = (node.data?.config?.orm as string) || DEFAULT_ORM;
    const connectionName =
      variables.connectionName ||
      (node.data?.config?.connectionName as string) ||
      DEFAULT_CONNECTION_NAME;
    const databaseType =
      (node.data?.config?.databaseType as string) || DEFAULT_DATABASE_TYPE;

    this.logger.log(
      `Generating database code for node ${node.id} (ORM: ${orm}, Type: ${databaseType}, Connection: ${connectionName})`
    );

    // Определяем путь к templates в зависимости от ORM
    const ormTemplatesPath = `${TEMPLATE_PATHS.COMPONENTS}/${orm}`;

    try {
      // Генерируем код для каждого компонента
      const [connection, schema, repository] = await Promise.all([
        this.generateConnection(ormTemplatesPath, connectionName, databaseType),
        this.generateSchema(ormTemplatesPath, variables, node),
        this.generateRepository(ormTemplatesPath, variables),
      ]);

      return {
        connection,
        schema,
        repository,
      };
    } catch (error) {
      return handleServiceError(
        this.logger,
        "generating database node code",
        error,
        {
          operation: "generating database node code",
          additional: {
            nodeId: node.id,
            orm,
            connectionName,
            databaseType,
          },
        }
      ) as never;
    }
  }

  /**
   * Генерирует connection код
   */
  @CatchError({ operation: "generating connection code" })
  private async generateConnection(
    ormTemplatesPath: string,
    connectionName: string,
    databaseType: string
  ): Promise<string> {
    const templatePath = `${ormTemplatesPath}/connection.ts.mdx`;
    const template = await this.templateEngine.loadTemplate(templatePath);

    // Подставляем переменные
    const result = this.templateEngine.substituteVariables(template, {
      CONNECTION_NAME: connectionName,
      DATABASE_TYPE: databaseType,
      DATABASE_URL: `process.env.DATABASE_URL_${connectionName.toUpperCase()}`,
    });

    return result.content;
  }

  /**
   * Генерирует schema код
   */
  @CatchError({ operation: "generating schema code" })
  private async generateSchema(
    ormTemplatesPath: string,
    variables: DatabaseCodeGenerationVariables,
    node?: Node
  ): Promise<string> {
    // Если есть данные из UI формы в node, используем SchemaGeneratorService
    if (node && this.hasUIFormData(node)) {
      try {
        const schema = await this.schemaGenerator.generateSchemaFromUIForm(
          node,
          {
            entityName: variables.entityName || "Entity",
            tableName: variables.tableName || "entities",
          }
        );
        return schema;
      } catch (error) {
        this.logger.warn(
          "Failed to generate schema from UI form, falling back to template",
          error
        );
        // Fallback to template
      }
    }

    // Fallback: используем template
    const templatePath = `${ormTemplatesPath}/schema.mdx`;
    const template = await this.templateEngine.loadTemplate(templatePath);

    // Подставляем переменные
    const result = this.templateEngine.substituteVariables(template, {
      ENTITY_NAME: variables.entityName || "Entity",
      TABLE_NAME: variables.tableName || "entities",
      FIELDS: variables.fields || "// No fields defined",
    });

    return result.content;
  }

  /**
   * Проверяет, есть ли данные UI формы в node
   */
  private hasUIFormData(node: Node): boolean {
    const config = node.data?.config;
    if (!config) {
      return false;
    }

    // Проверяем наличие fields в config
    const fields = config.fields;
    return (
      fields !== undefined &&
      fields !== null &&
      (Array.isArray(fields) || typeof fields === "object")
    );
  }

  /**
   * Генерирует repository код
   */
  @CatchError({ operation: "generating repository code" })
  private async generateRepository(
    ormTemplatesPath: string,
    variables: DatabaseCodeGenerationVariables
  ): Promise<string> {
    const templatePath = `${ormTemplatesPath}/repository.mdx`;
    const template = await this.templateEngine.loadTemplate(templatePath);

    const entityName = variables.entityName || "Entity";
    const entityNameLower =
      variables.entityNameLower ||
      entityName.charAt(0).toLowerCase() + entityName.slice(1);
    const tableName = variables.tableName || "entities";

    // Подставляем переменные
    const result = this.templateEngine.substituteVariables(template, {
      ENTITY_NAME: entityName,
      ENTITY_NAME_LOWER: entityNameLower,
      TABLE_NAME: tableName,
      SCHEMA: tableName, // В Drizzle schema обычно называется так же как таблица
    });

    return result.content;
  }

  /**
   * Определяет ORM из database node
   */
  getORMFromNode(node: Node): string {
    this.validateDatabaseNode(node);
    return (node.data?.config?.orm as string) || DEFAULT_ORM;
  }

  /**
   * Получает connection name из database node
   */
  getConnectionNameFromNode(node: Node): string {
    this.validateDatabaseNode(node);
    return (
      (node.data?.config?.connectionName as string) ||
      `db-${node.id.slice(0, 8)}`
    );
  }

  /**
   * Валидирует, что нода является database node
   */
  private validateDatabaseNode(node: Node): void {
    if (node.type !== NodeType.NODE_TYPE_DATABASE) {
      throw new Error(`Expected database node, got node type: ${node.type}`);
    }
  }
}
