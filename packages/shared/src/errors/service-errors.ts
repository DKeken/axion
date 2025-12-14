/**
 * Service error classes
 * Simple, typed error classes for Axion Stack
 */

import { ErrorCode } from "./error-codes";

export interface ErrorContext {
  operation?: string;
  resourceId?: string;
  resourceType?: string;
  userId?: string;
  additional?: Record<string, unknown>;
}

/**
 * Base error class for all service errors
 */
export class ServiceError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: ErrorContext;
  public readonly originalError?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    context?: ErrorContext,
    originalError?: unknown
  ) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.context = context;
    this.originalError = originalError;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ServiceError {
  constructor(
    message: string,
    field?: string,
    context?: ErrorContext,
    originalError?: unknown
  ) {
    super(
      ErrorCode.VALIDATION_ERROR,
      message,
      {
        ...context,
        additional: { ...context?.additional, ...(field && { field }) },
      },
      originalError
    );
    this.name = "ValidationError";
  }
}

/**
 * Not Found error (404)
 */
export class NotFoundError extends ServiceError {
  constructor(
    resourceType: string,
    resourceId?: string,
    context?: ErrorContext,
    originalError?: unknown
  ) {
    super(
      ErrorCode.NOT_FOUND,
      `${resourceType}${resourceId ? ` with id ${resourceId}` : ""} not found`,
      { ...context, resourceType, resourceId },
      originalError
    );
    this.name = "NotFoundError";
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends ServiceError {
  constructor(
    message: string,
    context?: ErrorContext,
    originalError?: unknown
  ) {
    super(ErrorCode.FORBIDDEN, message, context, originalError);
    this.name = "ForbiddenError";
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends ServiceError {
  constructor(
    message: string,
    context?: ErrorContext,
    originalError?: unknown
  ) {
    super(ErrorCode.DATABASE_ERROR, message, context, originalError);
    this.name = "DatabaseError";
  }
}

/**
 * Internal error (500)
 */
export class InternalError extends ServiceError {
  constructor(
    message: string,
    context?: ErrorContext,
    originalError?: unknown
  ) {
    super(ErrorCode.INTERNAL_ERROR, message, context, originalError);
    this.name = "InternalError";
  }
}

/**
 * Type guard to check if error is a ServiceError
 */
export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}
