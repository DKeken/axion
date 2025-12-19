/**
 * Constants for Template Engine Service
 */

/**
 * Template file extensions
 */
export const TEMPLATE_EXTENSIONS = [".mdx", ".md"] as const;

/**
 * Code block regex patterns for extracting code from markdown
 */
export const CODE_BLOCK_REGEX =
  /```(?:typescript|ts|javascript|js)?\n([\s\S]*?)```/g;

/**
 * Default template paths
 */
export const TEMPLATE_PATHS = {
  BASE: "docs/templates",
  COMPONENTS: "components",
  BLUEPRINTS: "blueprints",
  DRIZZLE: "components/drizzle",
  DATABASE_BASE: "components/database/base",
} as const;

/**
 * Default ORM type
 */
export const DEFAULT_ORM = "drizzle" as const;

/**
 * Default database type
 */
export const DEFAULT_DATABASE_TYPE = "postgresql" as const;

/**
 * Default connection name
 */
export const DEFAULT_CONNECTION_NAME = "main-db" as const;

/**
 * Default HTTP RPC configuration (service-to-service in Docker/Swarm)
 */
export const HTTP_RPC_DEFAULTS = {
  DEFAULT_PROTOCOL: "http",
  DEFAULT_PORT: 3000,
  DEFAULT_RPC_PATH_PREFIX: "/rpc",
} as const;

/**
 * Variable placeholder pattern
 */
export const VARIABLE_PLACEHOLDER_PATTERN = /\{([A-Z_]+)\}/g;
