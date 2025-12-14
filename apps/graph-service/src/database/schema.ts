import type {
  GraphData,
  DatabaseTypeDbValue,
  OrmTypeDbValue,
} from "@axion/contracts";
import {
  SERVICE_STATUS_DB,
  ServiceStatus,
  serviceStatusToDbString,
} from "@axion/contracts";
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
export const serviceStatusEnum = pgEnum("service_status", [
  SERVICE_STATUS_DB.PENDING,
  SERVICE_STATUS_DB.GENERATING,
  SERVICE_STATUS_DB.VALIDATED,
  SERVICE_STATUS_DB.ERROR,
  SERVICE_STATUS_DB.DEPLOYED,
  SERVICE_STATUS_DB.DELETED,
]);

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  graphVersion: integer("graph_version").notNull().default(1),
  infrastructureConfig: jsonb("infrastructure_config").$type<
    Record<string, string>
  >(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Project Graph Versions table (для версионирования графов)
export const projectGraphVersions = pgTable("project_graph_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  graphData: jsonb("graph_data").$type<GraphData>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Project Services table (сервисы из графа)
export const projectServices = pgTable("project_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  nodeId: varchar("node_id", { length: 255 }).notNull(), // = node.id в графе (критично!)
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  blueprintId: varchar("blueprint_id", { length: 255 }).notNull(),
  config: jsonb("config").$type<Record<string, string>>(),
  status: serviceStatusEnum("status")
    .notNull()
    .default(serviceStatusToDbString(ServiceStatus.SERVICE_STATUS_PENDING)),
  codeVersion: integer("code_version").notNull().default(1),
  generatedCodePath: text("generated_code_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Database Nodes table (отдельные database nodes из графа)
export const databaseNodes = pgTable("database_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  nodeId: varchar("node_id", { length: 255 }).notNull(), // = node.id в графе
  databaseType: varchar("database_type", { length: 50 })
    .notNull()
    .$type<DatabaseTypeDbValue>(),
  orm: varchar("orm", { length: 50 }).notNull().$type<OrmTypeDbValue>(),
  connectionName: varchar("connection_name", { length: 255 }).notNull(),
  config: jsonb("config").$type<{
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type Project = typeof projects.$inferSelect;
export type CreateProject = typeof projects.$inferInsert;
export type UpdateProject = Partial<
  Omit<CreateProject, "id" | "createdAt"> & {
    graphVersion?: number;
  }
>;

export type ProjectGraphVersion = typeof projectGraphVersions.$inferSelect;
export type CreateProjectGraphVersion =
  typeof projectGraphVersions.$inferInsert;
export type UpdateProjectGraphVersion = Partial<CreateProjectGraphVersion>;

export type ProjectService = typeof projectServices.$inferSelect;
export type CreateProjectService = typeof projectServices.$inferInsert;
export type UpdateProjectService = Partial<CreateProjectService>;

export type DatabaseNode = typeof databaseNodes.$inferSelect;
export type CreateDatabaseNode = typeof databaseNodes.$inferInsert;
export type UpdateDatabaseNode = Partial<CreateDatabaseNode>;
