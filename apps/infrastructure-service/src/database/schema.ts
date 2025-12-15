import {
  SERVER_STATUS_DB,
  ServerStatus,
  serverStatusToDbString,
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
export const serverStatusEnum = pgEnum("server_status", [
  SERVER_STATUS_DB.UNSPECIFIED,
  SERVER_STATUS_DB.CONNECTED,
  SERVER_STATUS_DB.DISCONNECTED,
  SERVER_STATUS_DB.ERROR,
  SERVER_STATUS_DB.PENDING,
  SERVER_STATUS_DB.INSTALLING,
]);

// Clusters table
export const clusters = pgTable("clusters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Servers table
export const servers = pgTable("servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  clusterId: uuid("cluster_id").references(() => clusters.id, {
    onDelete: "set null",
  }),
  host: varchar("host", { length: 255 }).notNull(),
  port: integer("port").notNull().default(22),
  username: varchar("username", { length: 255 }).notNull(),
  // SSH ключ хранится в зашифрованном виде
  encryptedPrivateKey: text("encrypted_private_key"),
  // Пароль хранится в зашифрованном виде (опционально, если используется ключ)
  encryptedPassword: text("encrypted_password"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: serverStatusEnum("status")
    .notNull()
    .default(serverStatusToDbString(ServerStatus.SERVER_STATUS_PENDING)),
  // Информация о сервере (OS, CPU, RAM, Docker и т.д.)
  serverInfo: jsonb("server_info").$type<{
    os?: string;
    architecture?: string;
    totalMemory?: number;
    availableMemory?: number;
    cpuCores?: number;
    cpuUsage?: number;
    dockerInstalled?: boolean;
    dockerVersion?: string;
  }>(),
  // ID Axion Runner Agent (если установлен)
  agentId: uuid("agent_id"),
  lastConnectedAt: timestamp("last_connected_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type Cluster = typeof clusters.$inferSelect;
export type CreateCluster = typeof clusters.$inferInsert;
export type UpdateCluster = Partial<
  Omit<CreateCluster, "id" | "createdAt"> & {
    updatedAt?: Date;
  }
>;

export type Server = typeof servers.$inferSelect;
export type CreateServer = typeof servers.$inferInsert;
export type UpdateServer = Partial<
  Omit<CreateServer, "id" | "createdAt"> & {
    updatedAt?: Date;
  }
>;
