/**
 * Types for Schema Generator Service
 */

export type UIFieldDefinition = {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "uuid" | "text" | "json";
  required?: boolean;
  unique?: boolean;
  defaultValue?: string;
  maxLength?: number;
  primaryKey?: boolean;
}

export type SchemaGenerationOptions = {
  entityName: string;
  tableName: string;
  fields?: UIFieldDefinition[];
  orm?: string;
}
 
