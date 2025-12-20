/**
 * HTTP client based on Ky with automatic retry, error handling, and auth
 */

import ky, { type HTTPError, type KyInstance, type Options } from "ky";

import {
  DEFAULT_BASE_URL,
  DEFAULT_RETRY_LIMIT,
  DEFAULT_RETRY_STATUS_CODES,
  DEFAULT_TIMEOUT,
} from "./constants";
import {
  ApiError,
  type ApiClientConfig,
  fromKyError,
  type RequestOptions,
} from "./types";

/**
 * HTTP client wrapper around Ky with enhanced error handling and auth
 */
export class HttpClient {
  private readonly kyInstance: KyInstance;
  private readonly config: ApiClientConfig;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      getAuthToken: config.getAuthToken,
      credentials: config.credentials ?? "include",
      headers: config.headers ?? {},
      retry: {
        limit: config.retry?.limit ?? DEFAULT_RETRY_LIMIT,
        statusCodes: config.retry?.statusCodes ?? DEFAULT_RETRY_STATUS_CODES,
        retryOnNetworkError: config.retry?.retryOnNetworkError ?? true,
      },
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      onRetry: config.onRetry,
      onError: config.onError,
    };

    this.kyInstance = ky.create({
      prefixUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      credentials: this.config.credentials,
      headers: this.config.headers,
      retry: {
        limit: this.config.retry?.limit ?? DEFAULT_RETRY_LIMIT,
        statusCodes:
          this.config.retry?.statusCodes ?? DEFAULT_RETRY_STATUS_CODES,
        methods: ["get", "post", "put", "patch", "delete"],
      },
      hooks: {
        beforeRequest: [
          async (request) => {
            // Add auth token if available
            const token = this.config.getAuthToken
              ? await this.config.getAuthToken()
              : null;

            if (token) {
              request.headers.set("Authorization", `Bearer ${token}`);
            }

            // Ensure Accept header
            if (!request.headers.has("Accept")) {
              request.headers.set("Accept", "application/json");
            }
          },
        ],
        beforeRetry: [
          async ({ request, error, retryCount }) => {
            // Call onRetry hook if provided
            if (this.config.onRetry && error instanceof Error) {
              const apiError = await this.toApiError(error);
              await this.config.onRetry(apiError, retryCount);
            }

            // Refresh token on 401 if we haven't retried yet
            if (
              retryCount === 1 &&
              error instanceof Error &&
              "response" in error &&
              (error as HTTPError).response.status === 401 &&
              this.config.getAuthToken
            ) {
              const token = await this.config.getAuthToken();
              if (token) {
                request.headers.set("Authorization", `Bearer ${token}`);
              }
            }
          },
        ],
        beforeError: [
          async (error) => {
            // Call onError hook if provided
            if (this.config.onError) {
              const apiError = await fromKyError(error);
              await this.config.onError(apiError);
            }
            return error;
          },
        ],
      },
    });
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  /**
   * Make a POST request
   */
  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }

  /**
   * Make a PUT request
   */
  async put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>("PUT", path, body, options);
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>("PATCH", path, body, options);
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", path, undefined, options);
  }

  /**
   * Internal request method
   */
  private async request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    try {
      const kyOptions: Options = {
        method,
        signal: options?.signal,
        cache: options?.cache,
        credentials: options?.credentials,
        timeout: options?.timeout,
        headers: options?.headers,
      };

      if (body !== undefined) {
        kyOptions.json = body;
      }

      // Add query params if provided
      if (options?.query) {
        const searchParams = new URLSearchParams();
        Object.entries(options.query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        kyOptions.searchParams = searchParams;
      }

      const response = await this.kyInstance(path, kyOptions);

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      // Parse JSON response
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return (await response.json()) as T;
      }

      // Fallback to text
      const text = await response.text();
      return text as unknown as T;
    } catch (error) {
      // Convert Ky error to ApiError
      throw await this.toApiError(error);
    }
  }

  /**
   * Convert error to ApiError
   */
  private async toApiError(error: unknown): Promise<ApiError> {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error && "response" in error && "request" in error) {
      return fromKyError(error as HTTPError);
    }

    // Generic error
    return new ApiError({
      message: error instanceof Error ? error.message : "Unknown error",
      status: 0,
      statusText: "Network Error",
      request: new Request(this.config.baseUrl ?? DEFAULT_BASE_URL),
    });
  }

  /**
   * Get the underlying Ky instance for advanced usage
   */
  getKyInstance(): KyInstance {
    return this.kyInstance;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.config.baseUrl ?? DEFAULT_BASE_URL;
  }
}

/**
 * Create a new HTTP client instance
 */
export function createHttpClient(config?: ApiClientConfig): HttpClient {
  return new HttpClient(config);
}
