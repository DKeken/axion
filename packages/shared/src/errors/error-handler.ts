/**
 * Unified error handler for Axion Stack
 * Minimal, reusable error handling that converts any error to contract-compatible response
 */

import {
  createErrorResponse,
  createValidationError,
  createNotFoundError,
  createForbiddenError,
  type Error as ContractError,
} from "@axion/contracts";

import { classifyDatabaseError } from "./database-error-handler";
import {
  ServiceError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  InternalError,
  isServiceError,
  type ErrorContext,
} from "./service-errors";

/**
 * Minimal logger interface to avoid direct dependency on @nestjs/common in frontend
 */
export type ILogger = {
  error: (message: string, error?: unknown) => void;
  warn?: (message: string, error?: unknown) => void;
  debug?: (message: string, error?: unknown) => void;
  log?: (message: string, error?: unknown) => void;
}

/**
 * Convert ServiceError to Contract Error
 */
function serviceErrorToContractError(error: ServiceError): ContractError {
  const details: Record<string, string> = {};

  if (error.context?.resourceType) {
    details.resourceType = error.context.resourceType;
  }
  if (error.context?.resourceId) {
    details.resourceId = error.context.resourceId;
  }
  if (error.context?.operation) {
    details.operation = error.context.operation;
  }
  if (error.context?.additional) {
    for (const [key, value] of Object.entries(error.context.additional)) {
      if (typeof value === "string") {
        details[key] = value;
      }
    }
  }

  return {
    code: error.code,
    message: error.message,
    details,
  };
}

/**
 * Classify unknown error and convert to ServiceError
 */
function classifyError(error: unknown, context?: ErrorContext): ServiceError {
  // Already a ServiceError
  if (isServiceError(error)) {
    return error;
  }

  // Database errors
  if (
    error &&
    typeof error === "object" &&
    ("code" in error || "cause" in error)
  ) {
    try {
      return classifyDatabaseError(error, context);
    } catch {
      // Fall through to generic error
    }
  }

  // Pattern matching for common error messages
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("required") ||
      message.includes("invalid") ||
      message.includes("validation") ||
      message.includes("must be")
    ) {
      return new ValidationError(error.message, undefined, context, error);
    }

    if (message.includes("not found") || message.includes("does not exist")) {
      return new NotFoundError("Resource", undefined, context, error);
    }

    if (message.includes("forbidden") || message.includes("permission")) {
      return new ForbiddenError(error.message, context, error);
    }
  }

  // Generic internal error
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred";
  return new InternalError(message, context, error);
}

/**
 * Convert ServiceError to contract error response
 */
function serviceErrorToErrorResponse(
  serviceError: ServiceError
): ReturnType<typeof createErrorResponse> {
  if (serviceError instanceof ValidationError) {
    const field = serviceError.context?.additional?.field as string | undefined;
    return createErrorResponse(
      createValidationError(serviceError.message, field)
    );
  }

  if (serviceError instanceof NotFoundError) {
    return createErrorResponse(
      createNotFoundError(
        serviceError.context?.resourceType || "Resource",
        serviceError.context?.resourceId
      )
    );
  }

  if (serviceError instanceof ForbiddenError) {
    return createErrorResponse(createForbiddenError(serviceError.message));
  }

  // For other errors, use generic error creation
  const contractError = serviceErrorToContractError(serviceError);
  return createErrorResponse(contractError);
}

/**
 * Log error with appropriate level based on error type
 */
function logError(
  logger: ILogger,
  serviceError: ServiceError,
  operation: string
): void {
  const contextInfo = serviceError.context
    ? ` | Context: ${JSON.stringify(serviceError.context)}`
    : "";
  const logMessage = `Error ${operation}: ${serviceError.message}${contextInfo}`;

  if (serviceError instanceof ValidationError) {
    // Validation errors are usually expected
    if (typeof logger.warn === "function") {
      logger.warn(logMessage, serviceError.originalError);
    } else {
      logger.error(logMessage, serviceError.originalError);
    }
  } else if (serviceError instanceof NotFoundError) {
    // Not found is usually expected
    if (typeof logger.debug === "function") {
      logger.debug(logMessage, serviceError.originalError);
    } else {
      logger.error(logMessage, serviceError.originalError);
    }
  } else {
    // Internal, database, and other critical errors
    logger.error(logMessage, serviceError.originalError || serviceError);
  }
}

/**
 * Unified error handler for microservices
 *
 * @example
 * ```typescript
 * try {
 *   // operation
 * } catch (error) {
 *   return handleServiceError(this.logger, "creating project", error);
 * }
 * ```
 */
export function handleServiceError(
  logger: ILogger,
  operation: string,
  error: unknown,
  context?: ErrorContext
): ReturnType<typeof createErrorResponse> {
  const serviceError = classifyError(error, {
    ...context,
    operation: context?.operation || operation,
  });

  logError(logger, serviceError, operation);
  return serviceErrorToErrorResponse(serviceError);
}

/**
 * Extract user-friendly error message (hides internal error details)
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isServiceError(error)) {
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof ForbiddenError
    ) {
      return error.message;
    }
    return "An error occurred. Please try again later.";
  }
  return "An unexpected error occurred.";
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}
