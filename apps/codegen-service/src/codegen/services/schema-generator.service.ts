/**
 * Schema Generator Service
 * Генерирует Drizzle schema из данных UI формы
 */

import { type Node } from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import type {
  SchemaGenerationOptions,
  UIFieldDefinition,
} from "@/codegen/types/schema-generator.types";

/**
 * Schema Generator Service
 * Преобразует данные UI формы в Drizzle schema код
 */
@Injectable()
export class SchemaGeneratorService extends BaseService {
  constructor() {
    super(SchemaGeneratorService.name);
  }

  /**
   * Генерирует Drizzle schema из данных UI формы
   * @param node - database node или service node с данными формы
   * @param options - опции генерации
   * @returns Drizzle schema код
   */
  @CatchError({ operation: "generating schema from UI form" })
  async generateSchemaFromUIForm(
    node: Node,
    options: SchemaGenerationOptions
  ): Promise<string> {
    const fields = this.extractFieldsFromNode(node, options.fields);

    if (fields.length === 0) {
      return this.generateEmptySchema(options.entityName, options.tableName);
    }

    return this.generateDrizzleSchema(
      options.entityName,
      options.tableName,
      fields
    );
  }

  /**
   * Извлекает поля из database node или использует переданные
   */
  private extractFieldsFromNode(
    node: Node,
    providedFields?: UIFieldDefinition[]
  ): UIFieldDefinition[] {
    // Если поля переданы явно, используем их
    if (providedFields && providedFields.length > 0) {
      return providedFields;
    }

    // Пытаемся извлечь из node.data.config
    const config = node.data?.config;
    if (!config) {
      return [];
    }

    // Проверяем наличие fields в config
    const fieldsData = config.fields as unknown as
      | UIFieldDefinition[]
      | Record<string, unknown>
      | undefined;

    if (!fieldsData) {
      return [];
    }

    // Преобразуем в массив, если это объект
    if (Array.isArray(fieldsData)) {
      return fieldsData;
    }

    // Если это объект, преобразуем в массив
    if (typeof fieldsData === "object") {
      return Object.entries(fieldsData).map(([name, field]) => {
        const fieldType = (field as { type?: string })?.type || "string";
        const validType: UIFieldDefinition["type"] =
          fieldType === "string" ||
          fieldType === "number" ||
          fieldType === "boolean" ||
          fieldType === "date" ||
          fieldType === "uuid" ||
          fieldType === "text" ||
          fieldType === "json"
            ? fieldType
            : "string";

        return {
          name,
          type: validType,
          required: (field as { required?: boolean })?.required || false,
          unique: (field as { unique?: boolean })?.unique || false,
          defaultValue: (field as { defaultValue?: string })?.defaultValue,
          maxLength: (field as { maxLength?: number })?.maxLength,
          primaryKey: (field as { primaryKey?: boolean })?.primaryKey || false,
        };
      });
    }

    return [];
  }

  /**
   * Генерирует Drizzle schema код
   */
  private generateDrizzleSchema(
    entityName: string,
    tableName: string,
    fields: UIFieldDefinition[]
  ): string {
    const imports: string[] = [];
    const columns: string[] = [];

    // Обрабатываем каждое поле
    for (const field of fields) {
      const column = this.generateDrizzleColumn(field, imports);
      columns.push(column);
    }

    // Добавляем стандартные поля createdAt и updatedAt, если их нет
    const hasCreatedAt = fields.some((f) => f.name === "createdAt");
    const hasUpdatedAt = fields.some((f) => f.name === "updatedAt");

    if (!hasCreatedAt) {
      imports.push("timestamp");
      columns.push(
        '  createdAt: timestamp("created_at").notNull().defaultNow(),'
      );
    }

    if (!hasUpdatedAt) {
      imports.push("timestamp");
      columns.push(
        '  updatedAt: timestamp("updated_at").notNull().defaultNow(),'
      );
    }

    // Убираем дубликаты из imports
    const uniqueImports = Array.from(new Set(imports));

    const importsCode =
      uniqueImports.length > 0
        ? `import { ${uniqueImports.join(", ")} } from "drizzle-orm/pg-core";`
        : "";

    return `${importsCode}
import { pgTable } from "drizzle-orm/pg-core";

export const ${this.toCamelCase(tableName)} = pgTable("${tableName}", {
${columns.join("\n")}
});

export type ${entityName} = typeof ${this.toCamelCase(tableName)}.$inferSelect;
export type Create${entityName} = typeof ${this.toCamelCase(tableName)}.$inferInsert;
export type Update${entityName} = Partial<Create${entityName}>;
`;
  }

  /**
   * Генерирует Drizzle column для поля
   */
  private generateDrizzleColumn(
    field: UIFieldDefinition,
    imports: string[]
  ): string {
    const name = field.name;
    const columnName = this.toSnakeCase(name);
    let columnType = "";
    const modifiers: string[] = [];

    // Определяем тип колонки
    switch (field.type) {
      case "string":
        imports.push("varchar");
        if (field.maxLength) {
          columnType = `varchar("${columnName}", { length: ${field.maxLength} })`;
        } else {
          columnType = `varchar("${columnName}", { length: 255 })`;
        }
        break;
      case "text":
        imports.push("text");
        columnType = `text("${columnName}")`;
        break;
      case "number":
        imports.push("integer");
        columnType = `integer("${columnName}")`;
        break;
      case "boolean":
        imports.push("boolean");
        columnType = `boolean("${columnName}")`;
        break;
      case "date":
        imports.push("timestamp");
        columnType = `timestamp("${columnName}")`;
        break;
      case "uuid":
        imports.push("uuid");
        columnType = `uuid("${columnName}")`;
        break;
      case "json":
        imports.push("jsonb");
        columnType = `jsonb("${columnName}")`;
        break;
      default:
        imports.push("varchar");
        columnType = `varchar("${columnName}", { length: 255 })`;
    }

    // Добавляем модификаторы
    if (field.primaryKey) {
      modifiers.push(".primaryKey()");
    }

    if (field.required) {
      modifiers.push(".notNull()");
    }

    if (field.unique) {
      modifiers.push(".unique()");
    }

    if (field.defaultValue !== undefined) {
      if (field.type === "uuid") {
        modifiers.push(".defaultRandom()");
      } else if (field.type === "string" || field.type === "text") {
        modifiers.push(`.default("${field.defaultValue}")`);
      } else if (field.type === "number") {
        modifiers.push(`.default(${field.defaultValue})`);
      } else if (field.type === "boolean") {
        modifiers.push(`.default(${field.defaultValue === "true"})`);
      }
    }

    return `  ${name}: ${columnType}${modifiers.join("")},`;
  }

  /**
   * Генерирует пустую schema (без полей, только базовые)
   */
  private generateEmptySchema(entityName: string, tableName: string): string {
    return `import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";

export const ${this.toCamelCase(tableName)} = pgTable("${tableName}", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ${entityName} = typeof ${this.toCamelCase(tableName)}.$inferSelect;
export type Create${entityName} = typeof ${this.toCamelCase(tableName)}.$inferInsert;
export type Update${entityName} = Partial<Create${entityName}>;
`;
  }

  /**
   * Преобразует строку в camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(/[\s_-]+/)
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("");
  }

  /**
   * Преобразует строку в snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  }
}
