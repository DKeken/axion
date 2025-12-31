/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { ConnectRouter } from "@connectrpc/connect";

/**
 * Interface for controllers that provide Connect-RPC routes
 * Controllers implementing this interface can be automatically registered
 */
export interface ConnectRpcProvider {
  /**
   * Creates a Connect-RPC router function
   * @returns Function that registers routes on the provided router
   */
  createRouter(): (router: ConnectRouter) => void;
}

/**
 * Options for Connect-RPC server setup
 */
export interface ConnectRpcOptions {
  /**
   * Path prefix for Connect-RPC endpoints
   * @default ""
   */
  pathPrefix?: string;

  /**
   * Enable CORS for Connect-RPC endpoints
   * @default true
   */
  cors?: boolean;

  /**
   * Custom CORS origin
   * @default true (allow all)
   */
  corsOrigin?: string | boolean;

  /**
   * Enable health check endpoint
   * @default true
   */
  healthCheck?: boolean;

  /**
   * Health check path
   * @default "/health"
   */
  healthCheckPath?: string;
}
