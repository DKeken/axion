/**
 * SSE (Server-Sent Events) client for real-time updates
 */

import {
  SSE_DEFAULT_MAX_RECONNECT_ATTEMPTS,
  SSE_DEFAULT_RECONNECT_DELAY,
} from "./constants";
import { ApiError } from "./types";

export type SSEMessageHandler<T = unknown> = (data: T) => void;
export type SSEErrorHandler = (error: ApiError | Error) => void;
export type SSEOpenHandler = () => void;

export type SSEClientConfig = {
  /**
   * URL to connect to
   */
  url: string;

  /**
   * Optional auth token provider
   */
  getAuthToken?: () => Promise<string | null> | string | null;

  /**
   * Optional headers
   */
  headers?: Record<string, string>;

  /**
   * Reconnect on error
   * @default true
   */
  reconnect?: boolean;

  /**
   * Reconnect delay in milliseconds
   * @default SSE_DEFAULT_RECONNECT_DELAY (3000ms)
   */
  reconnectDelay?: number;

  /**
   * Maximum reconnect attempts
   * @default SSE_DEFAULT_MAX_RECONNECT_ATTEMPTS (Infinity)
   */
  maxReconnectAttempts?: number;
};

/**
 * SSE Client for real-time updates
 */
export class SSEClient {
  private readonly config: SSEClientConfig;
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isClosed = false;

  private messageHandlers = new Map<string, Set<SSEMessageHandler>>();
  private errorHandlers = new Set<SSEErrorHandler>();
  private openHandlers = new Set<SSEOpenHandler>();

  constructor(config: SSEClientConfig) {
    this.config = {
      url: config.url,
      getAuthToken: config.getAuthToken,
      headers: config.headers ?? {},
      reconnect: config.reconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? SSE_DEFAULT_RECONNECT_DELAY,
      maxReconnectAttempts:
        config.maxReconnectAttempts ?? SSE_DEFAULT_MAX_RECONNECT_ATTEMPTS,
    };
  }

  /**
   * Connect to SSE endpoint
   */
  async connect(): Promise<void> {
    if (this.eventSource) {
      return; // Already connected
    }

    this.isClosed = false;

    try {
      // Build URL with auth token if available
      const url = await this.buildUrl();

      // Create EventSource (note: EventSource doesn't support custom headers in browser)
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.openHandlers.forEach((handler) => handler());
      };

      this.eventSource.onerror = () => {
        const error = new Error("SSE connection error");
        this.errorHandlers.forEach((handler) => handler(error));

        if (this.config.reconnect && !this.isClosed) {
          this.handleReconnect();
        }
      };

      this.eventSource.onmessage = (event) => {
        this.handleMessage("message", event.data);
      };
    } catch (error) {
      const apiError =
        error instanceof Error ? error : new Error("Failed to connect to SSE");
      this.errorHandlers.forEach((handler) => handler(apiError));

      if (this.config.reconnect && !this.isClosed) {
        this.handleReconnect();
      }
    }
  }

  /**
   * Subscribe to specific event type
   */
  on<T = unknown>(event: string, handler: SSEMessageHandler<T>): () => void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());

      // Add event listener to EventSource
      if (this.eventSource) {
        this.eventSource.addEventListener(event, (e) => {
          this.handleMessage(event, (e as MessageEvent).data);
        });
      }
    }

    const handlers = this.messageHandlers.get(event);
    if (!handlers) {
      return () => {};
    }
    handlers.add(handler as SSEMessageHandler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(event);
      if (handlers) {
        handlers.delete(handler as SSEMessageHandler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(event);
        }
      }
    };
  }

  /**
   * Subscribe to errors
   */
  onError(handler: SSEErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to open event
   */
  onOpen(handler: SSEOpenHandler): () => void {
    this.openHandlers.add(handler);
    return () => {
      this.openHandlers.delete(handler);
    };
  }

  /**
   * Close connection
   */
  close(): void {
    this.isClosed = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (
      this.eventSource !== null &&
      this.eventSource.readyState === EventSource.OPEN
    );
  }

  /**
   * Get current reconnect attempts
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Build URL with auth token
   */
  private async buildUrl(): Promise<string> {
    const url = new URL(this.config.url);

    // Add auth token as query param if available (since EventSource doesn't support headers)
    const token = this.config.getAuthToken
      ? await this.config.getAuthToken()
      : null;

    if (token) {
      url.searchParams.set("token", token);
    }

    // Add custom headers as query params (limitation of EventSource)
    if (this.config.headers) {
      Object.entries(this.config.headers).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: string, data: string): void {
    const handlers = this.messageHandlers.get(event);
    if (!handlers || handlers.size === 0) return;

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(data);
      handlers.forEach((handler) => handler(parsed));
    } catch {
      // If not JSON, pass as string
      handlers.forEach((handler) => handler(data));
    }
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(): void {
    if (
      this.reconnectAttempts >=
        (this.config.maxReconnectAttempts ??
          SSE_DEFAULT_MAX_RECONNECT_ATTEMPTS) ||
      this.isClosed
    ) {
      return;
    }

    this.reconnectAttempts++;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.config.reconnectDelay ?? SSE_DEFAULT_RECONNECT_DELAY);
  }
}

/**
 * Create SSE client
 */
export function createSSEClient(config: SSEClientConfig): SSEClient {
  return new SSEClient(config);
}
