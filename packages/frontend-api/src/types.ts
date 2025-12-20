/**
 * Shared types for frontend-api package
 */

import type { HTTPError as KyHTTPError } from "ky";

/**
 * Configuration for the API client
 */
export type ApiClientConfig = {
  /**
   * Base URL for API requests
   * @default process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3000"
   */
  baseUrl?: string;

  /**
   * Optional async token provider; resolved before each request.
   * Useful for refreshing tokens or retrieving from secure storage.
   */
  getAuthToken?: () => Promise<string | null> | string | null;

  /**
   * Default credentials strategy.
   * @default "include" for cookie-based auth
   */
  credentials?: RequestCredentials;

  /**
   * Static headers appended to every request.
   */
  headers?: Record<string, string>;

  /**
   * Retry configuration
   */
  retry?: {
    /**
     * Maximum number of retry attempts
     * @default 2
     */
    limit?: number;

    /**
     * Status codes to retry on
     * @default [408, 409, 429, 500, 502, 503, 504]
     */
    statusCodes?: number[];

    /**
     * Retry on network errors
     * @default true
     */
    retryOnNetworkError?: boolean;
  };

  /**
   * Request timeout in milliseconds
   * @default 30000 (30s)
   */
  timeout?: number;

  /**
   * Hook called before retry
   */
  onRetry?: (error: ApiError, retryCount: number) => void | Promise<void>;

  /**
   * Hook called on error
   */
  onError?: (error: ApiError) => void | Promise<void>;
};

/**
 * Enhanced API error with context
 */
export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly payload?: unknown;
  readonly requestId?: string | null;
  readonly request: Request;
  readonly response?: Response;

  constructor(options: {
    message: string;
    status: number;
    statusText: string;
    payload?: unknown;
    requestId?: string | null;
    request: Request;
    response?: Response;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.payload = options.payload;
    this.requestId = options.requestId;
    this.request = options.request;
    this.response = options.response;
  }

  /**
   * Check if error is from contract response (has error field)
   */
  isContractError(): boolean {
    return (
      typeof this.payload === "object" &&
      this.payload !== null &&
      "error" in this.payload
    );
  }

  /**
   * Get contract error if available
   */
  getContractError():
    | { code: string; message: string; details?: unknown }
    | undefined {
    if (!this.isContractError()) return undefined;
    return (this.payload as { error: unknown }).error as {
      code: string;
      message: string;
      details?: unknown;
    };
  }

  /**
   * Check if error is a specific HTTP status
   */
  is(status: number): boolean {
    return this.status === status;
  }

  /**
   * Check if error is client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }
}

/**
 * Convert Ky HTTPError to ApiError
 */
export async function fromKyError(error: KyHTTPError): Promise<ApiError> {
  const { response, request } = error;
  const requestId = response.headers.get("x-request-id");
  const contentType = response.headers.get("content-type");

  let payload: unknown = undefined;

  if (contentType?.includes("application/json")) {
    try {
      payload = await response.clone().json();
    } catch {
      // Ignore JSON parse errors
    }
  } else {
    try {
      payload = await response.clone().text();
    } catch {
      // Ignore text parse errors
    }
  }

  const message = extractErrorMessage(payload) || error.message;

  return new ApiError({
    message,
    status: response.status,
    statusText: response.statusText,
    payload,
    requestId,
    request,
    response,
  });
}

/**
 * Extract error message from payload
 */
function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload) return undefined;
  if (typeof payload === "string") return payload;
  if (typeof payload === "object") {
    // Check for contract error format
    if ("error" in (payload as Record<string, unknown>)) {
      const error = (payload as Record<string, unknown>).error;
      if (
        error &&
        typeof error === "object" &&
        "message" in (error as Record<string, unknown>)
      ) {
        const message = (error as Record<string, unknown>).message;
        if (typeof message === "string") return message;
      }
    }
    // Check for direct message
    if ("message" in (payload as Record<string, unknown>)) {
      const message = (payload as Record<string, unknown>).message;
      if (typeof message === "string") return message;
    }
  }
  return undefined;
}

/**
 * Request options for API calls
 */
export type RequestOptions = {
  signal?: AbortSignal;
  cache?: RequestCache;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  timeout?: number;
  /**
   * Query parameters to append to the URL
   */
  query?: Record<string, string | number | boolean | undefined | null>;
};

/**
 * Omit metadata from request types for frontend API
 */
export type OmitMetadata<T> = Omit<T, "metadata">;

/**
 * Omit metadata and specific fields from request types
 */
export type OmitMetadataAndFields<T, K extends keyof T> = Omit<
  T,
  "metadata" | K
>;

/**
 * Extract only specific fields from request types (excluding metadata)
 */
export type PickFieldsWithoutMetadata<
  T,
  K extends keyof Omit<T, "metadata">,
> = Pick<Omit<T, "metadata">, K>;
