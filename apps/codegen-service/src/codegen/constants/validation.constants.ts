/**
 * Constants for Validation System
 */

/**
 * Validation levels in order of execution
 */
export const VALIDATION_LEVELS = [
  "structural",
  "contract",
  "typescript",
  "build",
  "healthCheck",
  "contractDiscovery",
] as const;

/**
 * Required files for structural validation
 */
export const REQUIRED_FILES = [
  "src/main.ts",
  "src/app.module.ts",
  "src/health/health.controller.ts",
  "src/health/health.module.ts",
] as const;

/**
 * Timeouts for validators
 */
export const VALIDATION_TIMEOUTS = {
  TYPESCRIPT: 30000, // 30 seconds
  BUILD: 60000, // 60 seconds
  HEALTH_CHECK: 30000, // 30 seconds
  DOCKER_START: 60000, // 60 seconds
} as const;

/**
 * Regex patterns for validation
 */
export const VALIDATION_PATTERNS = {
  MESSAGE_PATTERN: /@MessagePattern\s*\(['"]([^'"]+)['"]\)/g,
  EVENT_PATTERN: /@EventPattern\s*\(['"]([^'"]+)['"]\)/g,
  TYPESCRIPT_ERROR:
    /([^(]+)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+)?:\s*(.+)/g,
} as const;
