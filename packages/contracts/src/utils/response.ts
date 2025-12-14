/**
 * Response utilities for working with contract responses
 */

import { Status } from "../../generated/common/common";
import { ErrorCode } from "../constants/error-codes";
import type { Error as ContractError } from "../../generated/common/common";

export interface ResponseWithOneof<T> {
  status: Status;
  result?: {
    error?: ContractError;
    data?: T;
    [key: string]: unknown;
  };
}

export function createSuccessResponse<T>(
  data: T,
  status: Status = Status.STATUS_SUCCESS
): ResponseWithOneof<T> {
  return { status, result: { data } };
}

export function createErrorResponse(
  error: ContractError,
  status: Status = Status.STATUS_ERROR
): ResponseWithOneof<never> {
  return { status, result: { error } };
}

export function isSuccessResponse<T>(
  response: ResponseWithOneof<T>
): response is ResponseWithOneof<T> & { result: { data: T } } {
  return (
    response.status === Status.STATUS_SUCCESS &&
    response.result?.data !== undefined &&
    response.result?.error === undefined
  );
}

export function isErrorResponse<T>(
  response: ResponseWithOneof<T>
): response is ResponseWithOneof<T> & { result: { error: ContractError } } {
  return (
    response.status === Status.STATUS_ERROR ||
    response.result?.error !== undefined
  );
}

export function extractData<T>(response: ResponseWithOneof<T>): T {
  if (isErrorResponse(response)) {
    const error = response.result?.error;
    const err = new globalThis.Error(error?.message || "Unknown error");
    if (error) {
      Object.assign(err, { cause: error });
    }
    throw err;
  }
  if (!isSuccessResponse(response)) {
    throw new globalThis.Error("Response does not contain data");
  }
  return response.result.data;
}

export function createError(
  code: string,
  message: string,
  details?: Record<string, string>
): ContractError {
  return { code, message, details: details || {} };
}

export function createValidationError(
  message: string,
  field?: string
): ContractError {
  return createError(
    ErrorCode.VALIDATION_ERROR,
    message,
    field ? { field } : {}
  );
}

export function createNotFoundError(
  resource: string,
  id?: string
): ContractError {
  return createError(
    ErrorCode.NOT_FOUND,
    `${resource}${id ? ` with id ${id}` : ""} not found`,
    id ? { id } : {}
  );
}

export function createForbiddenError(message?: string): ContractError {
  return createError(ErrorCode.FORBIDDEN, message || "Access forbidden");
}
