/**
 * Standardized error codes for Axion Stack
 * Minimal set of error codes following the pattern: CATEGORY_SUBCATEGORY
 */

export enum ErrorCode {
  // Validation (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // Authentication & Authorization (401, 403)
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // Not Found (404)
  NOT_FOUND = "NOT_FOUND",

  // Conflict (409)
  CONFLICT = "CONFLICT",

  // Database (500)
  DATABASE_ERROR = "DATABASE_ERROR",

  // Internal (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",

  // External service (502, 503)
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Rate limit (429)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}
