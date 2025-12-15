/**
 * Service Status values in Database
 * This must match the postgres enum definition in the database schema.
 */
export const SERVICE_STATUS_DB = {
  PENDING: "pending",
  GENERATING: "generating",
  VALIDATED: "validated",
  ERROR: "error",
  DEPLOYED: "deployed",
  DELETED: "deleted",
} as const;

export const DATABASE_TYPES = {
  POSTGRESQL: "postgresql",
  MYSQL: "mysql",
  REDIS: "redis",
  MONGODB: "mongodb",
} as const;

export type DatabaseTypeDbValue =
  (typeof DATABASE_TYPES)[keyof typeof DATABASE_TYPES];

export const ORM_TYPES = {
  DRIZZLE: "drizzle",
  TYPEORM: "typeorm",
  PRISMA: "prisma",
  MONGOOSE: "mongoose",
} as const;

export type OrmTypeDbValue = (typeof ORM_TYPES)[keyof typeof ORM_TYPES];

/**
 * Server Status values in Database
 * This must match the postgres enum definition in the database schema.
 */
export const SERVER_STATUS_DB = {
  UNSPECIFIED: "unspecified",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
  PENDING: "pending",
  INSTALLING: "installing",
} as const;

/**
 * Deployment Status values in Database
 * This must match the postgres enum definition in the database schema.
 */
export const DEPLOYMENT_STATUS_DB = {
  UNSPECIFIED: "unspecified",
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  SUCCESS: "success",
  FAILED: "failed",
  ROLLING_BACK: "rolling_back",
  ROLLED_BACK: "rolled_back",
} as const;
