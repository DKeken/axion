// Enums are defined in database schema, not imported from contracts
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const blueprintCategoryEnum = pgEnum("blueprint_category", [
  "unspecified",
  "crud",
  "auth",
  "payment",
  "notification",
  "analytics",
  "custom",
]);

export const validationStatusEnum = pgEnum("validation_status", [
  "unspecified",
  "pending",
  "validated",
  "error",
]);

export const validationLevelEnum = pgEnum("validation_level", [
  "unspecified",
  "structural",
  "contract",
  "typescript",
  "build",
  "health",
  "contract_discovery",
]);

// Blueprints table
export const blueprints = pgTable("blueprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  category: blueprintCategoryEnum("category").notNull().default("custom"),
  description: text("description"),
  version: varchar("version", { length: 50 }).notNull().default("1.0.0"),
  structure: jsonb("structure").$type<{
    requiredFiles?: Array<{
      path: string;
      immutable: boolean;
      templatePath: string;
    }>;
    templates?: Record<string, string>;
    llmGenerationPoints?: Array<{
      filePath: string;
      marker: string;
      description: string;
    }>;
  }>(),
  infrastructure: jsonb("infrastructure").$type<{
    database?: {
      type: string; // Will be converted to DatabaseType enum
      schemaTemplate?: string;
      uiForm?: Record<string, string>;
    };
    cache?: {
      type: string; // Will be converted to CacheType enum
      enabled: boolean;
    };
    queue?: {
      type: string; // Will be converted to QueueType enum
      enabled: boolean;
    };
  }>(),
  contracts: jsonb("contracts").$type<{
    autoGenerate?: boolean;
    basePattern?: string;
    defaultActions?: string[];
  }>(),
  llmInstructions: text("llm_instructions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Generation history table
export const generationHistory = pgTable("generation_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  nodeId: uuid("node_id"), // ID ноды в графе (для конкретного сервиса)
  serviceId: uuid("service_id"), // ID сервиса из graph-service
  serviceName: varchar("service_name", { length: 255 }),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id),
  codeVersion: integer("code_version").notNull().default(1),
  generatedCodePath: text("generated_code_path"),
  status: validationStatusEnum("status").notNull().default("pending"),
  validationErrors: jsonb("validation_errors").$type<
    Array<{
      level: string;
      message: string;
      file?: string;
      line?: number;
      column?: number;
    }>
  >(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Validation results table
export const validationResults = pgTable("validation_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  nodeId: uuid("node_id"), // ID ноды в графе (для конкретного сервиса)
  serviceId: uuid("service_id"), // ID сервиса из graph-service
  generationHistoryId: uuid("generation_history_id").references(
    () => generationHistory.id
  ),
  status: validationStatusEnum("status").notNull().default("pending"),
  levelResults: jsonb("level_results").$type<{
    structuralPassed?: boolean;
    contractPassed?: boolean;
    typescriptPassed?: boolean;
    buildPassed?: boolean;
    healthCheckPassed?: boolean;
    contractDiscoveryPassed?: boolean;
  }>(),
  errors: jsonb("errors").$type<
    Array<{
      level: string;
      message: string;
      file?: string;
      line?: number;
      column?: number;
    }>
  >(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type Blueprint = typeof blueprints.$inferSelect;
export type CreateBlueprint = typeof blueprints.$inferInsert;
export type UpdateBlueprint = Partial<
  Omit<CreateBlueprint, "id" | "createdAt">
>;

export type GenerationHistory = typeof generationHistory.$inferSelect;
export type CreateGenerationHistory = typeof generationHistory.$inferInsert;
export type UpdateGenerationHistory = Partial<
  Omit<CreateGenerationHistory, "id" | "createdAt">
>;

export type ValidationResult = typeof validationResults.$inferSelect;
export type CreateValidationResult = typeof validationResults.$inferInsert;
export type UpdateValidationResult = Partial<
  Omit<CreateValidationResult, "id" | "createdAt">
>;
