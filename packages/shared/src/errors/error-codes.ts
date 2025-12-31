/**
 * Error codes - re-exported from @axion/contracts
 */

import { ErrorCode } from "@axion/contracts";

// Re-export for backward compatibility
export { ErrorCode };

/**
 * Map protobuf ErrorCode to human-readable string
 */
export function errorCodeToString(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.VALIDATION:
      return "VALIDATION_ERROR";
    case ErrorCode.NOT_FOUND:
      return "NOT_FOUND";
    case ErrorCode.UNAUTHORIZED:
      return "UNAUTHORIZED";
    case ErrorCode.FORBIDDEN:
      return "FORBIDDEN";
    case ErrorCode.INTERNAL:
      return "INTERNAL_ERROR";
    case ErrorCode.DATABASE:
      return "DATABASE_ERROR";
    case ErrorCode.EXTERNAL_SERVICE:
      return "EXTERNAL_SERVICE_ERROR";
    default:
      return "UNKNOWN_ERROR";
  }
}

// Convenience constants for backward compatibility
export const ERROR_CODES = {
  VALIDATION: ErrorCode.VALIDATION,
  NOT_FOUND: ErrorCode.NOT_FOUND,
  UNAUTHORIZED: ErrorCode.UNAUTHORIZED,
  FORBIDDEN: ErrorCode.FORBIDDEN,
  INTERNAL: ErrorCode.INTERNAL,
  DATABASE: ErrorCode.DATABASE,
  EXTERNAL_SERVICE: ErrorCode.EXTERNAL_SERVICE,
} as const;
