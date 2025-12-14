/**
 * Base types for contracts
 */

import type { RequestMetadata as GeneratedRequestMetadata } from "../../generated/common/common";
import type { Status } from "./enums";

/**
 * Request metadata with support for both camelCase and snake_case
 * Extends the generated RequestMetadata to allow additional fields
 */
export type RequestMetadata = GeneratedRequestMetadata & {
  user_id?: string;
  project_id?: string;
  request_id?: string;
  [key: string]: unknown;
};

/**
 * Базовый интерфейс для всех Request сообщений
 */
export interface BaseRequest {
  metadata?: RequestMetadata;
}

/**
 * Базовый интерфейс для всех Response сообщений
 */
export interface BaseResponse {
  status: Status;
  result?: {
    error?: Error;
    [key: string]: unknown;
  };
}

/**
 * Error response
 */
export interface Error {
  code: string;
  message: string;
  details?: Record<string, string>;
}
