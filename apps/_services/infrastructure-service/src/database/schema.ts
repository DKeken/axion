import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Server Status Enum
 */
export const serverStatusEnum = pgEnum("server_status", [
  "ONLINE",
  "OFFLINE",
  "MAINTENANCE",
  "ERROR",
]);

/**
 * Agent Status Enum
 */
export const agentStatusEnum = pgEnum("agent_status", [
  "CONNECTED",
  "DISCONNECTED",
  "UPDATING",
]);

/**
 * Clusters Table
 * Stores logical grouping of servers
 */
export const clusters = pgTable("clusters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

/**
 * Servers Table
 * Stores information about registered servers
 */
export const servers = pgTable("servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  clusterId: uuid("cluster_id").references(() => clusters.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  hostname: varchar("hostname", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  status: serverStatusEnum("status").notNull().default("OFFLINE"),
  metadata: jsonb("metadata").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),
});

/**
 * Agents Table
 * Stores information about agents running on servers
 */
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 50 }).notNull(),
  status: agentStatusEnum("status").notNull().default("DISCONNECTED"),
  capabilities: jsonb("capabilities").$type<Record<string, string>>().default({}),
  token: text("token").notNull(), // Agent authentication token
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),
});

/**
 * Type inference for TypeScript
 */
export type Cluster = typeof clusters.$inferSelect;
export type CreateCluster = typeof clusters.$inferInsert;
export type UpdateCluster = Partial<CreateCluster>;

export type Server = typeof servers.$inferSelect;
export type CreateServer = typeof servers.$inferInsert;
export type UpdateServer = Partial<CreateServer>;

export type Agent = typeof agents.$inferSelect;
export type CreateAgent = typeof agents.$inferInsert;
export type UpdateAgent = Partial<CreateAgent>;
