import {
  DEPLOYMENT_STATUS_DB,
  DeploymentStatus,
  deploymentStatusToDbString,
  type DeploymentConfig,
  type ServiceDeploymentStatus,
} from "@axion/contracts";
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

// Enums
export const deploymentStatusEnum = pgEnum("deployment_status", [
  DEPLOYMENT_STATUS_DB.UNSPECIFIED,
  DEPLOYMENT_STATUS_DB.PENDING,
  DEPLOYMENT_STATUS_DB.IN_PROGRESS,
  DEPLOYMENT_STATUS_DB.SUCCESS,
  DEPLOYMENT_STATUS_DB.FAILED,
  DEPLOYMENT_STATUS_DB.ROLLING_BACK,
  DEPLOYMENT_STATUS_DB.ROLLED_BACK,
]);

// Deployments table
export const deployments = pgTable("deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  // Target: либо cluster_id, либо server_id (oneof в proto)
  clusterId: uuid("cluster_id"),
  serverId: uuid("server_id"),
  status: deploymentStatusEnum("status")
    .notNull()
    .default(
      deploymentStatusToDbString(DeploymentStatus.DEPLOYMENT_STATUS_PENDING)
    ),
  // Service deployment statuses (массив ServiceDeploymentStatus из контрактов)
  serviceStatuses:
    jsonb("service_statuses").$type<
      Array<Omit<ServiceDeploymentStatus, "status"> & { status: string }>
    >(),
  // Environment variables (map<string, string>)
  envVars: jsonb("env_vars").$type<Record<string, string>>(),
  // Deployment config (DeploymentConfig из контрактов)
  config: jsonb("config").$type<DeploymentConfig | null>(),
  // BullMQ job ID для отслеживания задачи в очереди
  jobId: text("job_id"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Deployment History table (для rollback)
export const deploymentHistory = pgTable("deployment_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  deploymentId: uuid("deployment_id")
    .notNull()
    .references(() => deployments.id, { onDelete: "cascade" }),
  // Сохраняем полную копию deployment для rollback (используем типы из схемы)
  deploymentSnapshot: jsonb("deployment_snapshot").$type<
    Omit<
      Deployment,
      | "id"
      | "projectId"
      | "clusterId"
      | "serverId"
      | "status"
      | "startedAt"
      | "completedAt"
      | "createdAt"
      | "updatedAt"
    > & {
      id: string;
      projectId: string;
      clusterId?: string;
      serverId?: string;
      status: string;
      jobId?: string | null;
      startedAt?: Date;
      completedAt?: Date;
    }
  >(),
  // Метаданные для истории
  version: text("version").notNull(), // Версия деплоя (можно использовать timestamp или номер)
  rolledBack: boolean("rolled_back").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Types
export type Deployment = typeof deployments.$inferSelect;
export type CreateDeployment = typeof deployments.$inferInsert;
export type UpdateDeployment = Partial<
  Omit<CreateDeployment, "id" | "createdAt"> & {
    updatedAt?: Date;
  }
>;

export type DeploymentHistory = typeof deploymentHistory.$inferSelect;
export type CreateDeploymentHistory = typeof deploymentHistory.$inferInsert;
export type UpdateDeploymentHistory = Partial<CreateDeploymentHistory>;
