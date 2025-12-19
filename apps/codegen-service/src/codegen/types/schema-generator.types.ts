/**
 * Types for Schema Generator Service
 */

export interface UIFieldDefinition {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "uuid" | "text" | "json";
  required?: boolean;
  unique?: boolean;
  defaultValue?: string;
  maxLength?: number;
  primaryKey?: boolean;
}

export interface SchemaGenerationOptions {
  entityName: string;
  tableName: string;
  fields?: UIFieldDefinition[];
  orm?: string;
}
/* eslint-enable @typescript-eslint/consistent-type-definitions */
