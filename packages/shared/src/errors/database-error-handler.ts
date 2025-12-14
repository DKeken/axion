/**
 * Database error classification
 * Handles PostgreSQL/Drizzle errors and converts them to ServiceErrors
 */

import {
  DatabaseError,
  ValidationError,
  ServiceError,
  type ErrorContext,
} from "./service-errors";

/**
 * PostgreSQL error codes
 */
enum PostgresErrorCode {
  UNIQUE_VIOLATION = "23505",
  FOREIGN_KEY_VIOLATION = "23503",
  NOT_NULL_VIOLATION = "23502",
  CHECK_VIOLATION = "23514",
  CONNECTION_FAILURE = "08006",
  CONNECTION_DOES_NOT_EXIST = "08003",
}

/**
 * Check if error is a PostgreSQL error
 */
function isPostgresError(error: unknown): error is {
  code?: string;
  message?: string;
  constraint?: string;
  column?: string;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

/**
 * Extract PostgreSQL error code from error (including nested in Drizzle)
 */
function getPostgresErrorCode(error: unknown): string | undefined {
  if (isPostgresError(error)) {
    return error.code;
  }

  // Check nested error in Drizzle
  if (typeof error === "object" && error !== null && "cause" in error) {
    return getPostgresErrorCode((error as { cause?: unknown }).cause);
  }

  return undefined;
}

/**
 * Classify database error and convert to ServiceError
 */
export function classifyDatabaseError(
  error: unknown,
  context?: ErrorContext
): ServiceError {
  const pgCode = getPostgresErrorCode(error);

  if (!pgCode) {
    const message =
      (isPostgresError(error) ? error.message : undefined) ||
      (error instanceof Error ? error.message : "Database operation failed");

    return new DatabaseError(message, context, error);
  }

  // Handle specific PostgreSQL error codes
  switch (pgCode) {
    case PostgresErrorCode.UNIQUE_VIOLATION:
      if (isPostgresError(error) && error.constraint) {
        return new ValidationError(
          `Duplicate entry: ${error.constraint}`,
          error.column,
          context,
          error
        );
      }
      return new ValidationError("Duplicate entry", undefined, context, error);

    case PostgresErrorCode.FOREIGN_KEY_VIOLATION:
      return new ValidationError(
        "Referenced resource does not exist",
        undefined,
        context,
        error
      );

    case PostgresErrorCode.NOT_NULL_VIOLATION:
      if (isPostgresError(error) && error.column) {
        return new ValidationError(
          `Field ${error.column} is required`,
          error.column,
          context,
          error
        );
      }
      return new ValidationError(
        "Required field is missing",
        undefined,
        context,
        error
      );

    case PostgresErrorCode.CHECK_VIOLATION:
      return new ValidationError(
        "Data validation constraint violation",
        undefined,
        context,
        error
      );

    case PostgresErrorCode.CONNECTION_FAILURE:
    case PostgresErrorCode.CONNECTION_DOES_NOT_EXIST:
      return new DatabaseError("Database connection failed", context, error);

    default: {
      const message =
        (isPostgresError(error) ? error.message : undefined) ||
        "Database operation failed";
      return new DatabaseError(message, context, error);
    }
  }
}
