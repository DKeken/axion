import type { Error as ContractError } from "@axion/contracts";
import { ErrorCode } from "@axion/shared";

/**
 * Map Protobuf/contract error codes to HTTP status codes.
 *
 * This is intentionally centralized to avoid service-by-service drift.
 */
export function mapContractErrorToHttpStatus(error: ContractError): number {
  switch (error.code) {
    case ErrorCode.VALIDATION_ERROR:
      return 400;
    case ErrorCode.UNAUTHORIZED:
      return 401;
    case ErrorCode.FORBIDDEN:
      return 403;
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.CONFLICT:
      return 409;
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 429;
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
      return 502;
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.INTERNAL_ERROR:
    default:
      return 500;
  }
}

