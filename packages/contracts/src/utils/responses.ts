import {
  type Error as AxionError,
  ErrorCode,
  ErrorSchema,
} from "../../generated/common/errors_pb";
import { create } from "@bufbuild/protobuf";

/**
 * Создает успешный ответ с данными
 * Примечание: В реальном использовании нужно обернуть data в соответствующий Response тип
 */
export function createSuccessResponse<T>(data: T): {
  result: { case: "data" | "success"; value: T };
} {
  return {
    result: {
      case: "data" as const,
      value: data,
    },
  };
}

/**
 * Создает ответ с ошибкой
 */
export function createErrorResponse(error: AxionError): {
  result: { case: "error"; value: AxionError };
} {
  return {
    result: {
      case: "error" as const,
      value: error,
    },
  };
}

/**
 * Создает ошибку валидации
 */
export function createValidationError(
  message: string,
  field?: string
): AxionError {
  return create(ErrorSchema, {
    code: ErrorCode.VALIDATION,
    message,
    field: field || "",
    metadata: {},
  });
}

/**
 * Создает ошибку "не найдено"
 */
export function createNotFoundError(
  resourceType: string,
  resourceId: string
): AxionError {
  return create(ErrorSchema, {
    code: ErrorCode.NOT_FOUND,
    message: `${resourceType} with id ${resourceId} not found`,
    field: "",
    metadata: {
      resourceType,
      resourceId,
    },
  });
}

/**
 * Создает ошибку неавторизованного доступа
 */
export function createUnauthorizedError(
  message: string = "Unauthorized"
): AxionError {
  return create(ErrorSchema, {
    code: ErrorCode.UNAUTHORIZED,
    message,
    field: "",
    metadata: {},
  });
}

/**
 * Создает ошибку запрещенного доступа
 */
export function createForbiddenError(
  message: string = "Forbidden"
): AxionError {
  return create(ErrorSchema, {
    code: ErrorCode.FORBIDDEN,
    message,
    field: "",
    metadata: {},
  });
}

/**
 * Создает внутреннюю ошибку сервера
 */
export function createInternalError(
  message: string = "Internal server error"
): AxionError {
  return create(ErrorSchema, {
    code: ErrorCode.INTERNAL,
    message,
    field: "",
    metadata: {},
  });
}

/**
 * Создает ошибку базы данных
 */
export function createDatabaseError(
  message: string,
  details?: Record<string, string>
): AxionError {
  return create(ErrorSchema, {
    code: ErrorCode.DATABASE,
    message,
    field: "",
    metadata: details || {},
  });
}

/**
 * Создает ошибку внешнего сервиса
 */
export function createExternalServiceError(
  serviceName: string,
  message: string
): AxionError {
  return create(ErrorSchema, {
    code: ErrorCode.EXTERNAL_SERVICE,
    message,
    field: "",
    metadata: {
      service: serviceName,
    },
  });
}

/**
 * Проверяет, является ли ответ успешным
 */
export function isSuccessResponse<T>(response: {
  result?: { case: string | undefined; value: unknown };
}): response is { result: { case: "data" | "success"; value: T } } {
  return (
    response.result?.case === "data" || response.result?.case === "success"
  );
}

/**
 * Проверяет, является ли ответ ошибкой
 */
export function isErrorResponse(response: {
  result?: { case: string | undefined; value: unknown };
}): response is { result: { case: "error"; value: AxionError } } {
  return response.result?.case === "error";
}
