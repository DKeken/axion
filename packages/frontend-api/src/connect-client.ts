/**
 * Connect-RPC client configuration with authentication and interceptors
 */

import type { GenService } from "@bufbuild/protobuf/codegenv2";
import { createClient, type Transport } from "@connectrpc/connect";
import { createConnectTransport as createWebTransport } from "@connectrpc/connect-web";

/**
 * Connect client configuration
 */
export type ConnectClientConfig = {
  /**
   * Base URL for the API (e.g. "https://api.example.com")
   */
  baseUrl: string;

  /**
   * Function to get auth token (called on each request)
   */
  getAuthToken?: () => Promise<string | null> | string | null;

  /**
   * Function to get current user ID (for RequestMetadata)
   */
  getUserId?: () => Promise<string | null> | string | null;

  /**
   * Called when an error occurs
   */
  onError?: (error: unknown) => void | Promise<void>;
};

/**
 * Create Connect-RPC transport with authentication
 */
export function createAxionTransport(config: ConnectClientConfig): Transport {
  return createWebTransport({
    baseUrl: config.baseUrl,

    // Use fetch API for requests
    useBinaryFormat: true, // Use JSON for debugging (можно поменять на true для production)

    // Add interceptors for auth and error handling
    interceptors: [
      // Auth interceptor
      (next) => async (req) => {
        // Get auth token if available
        if (config.getAuthToken) {
          const token = await config.getAuthToken();
          if (token) {
            req.header.set("Authorization", `Bearer ${token}`);
          }
        }

        // Continue with request
        try {
          return await next(req);
        } catch (error) {
          // Call error handler if provided
          if (config.onError) {
            await config.onError(error);
          }
          throw error;
        }
      },
    ],
  });
}

/**
 * Create a Connect-RPC client for a specific service
 *
 * @example
 * ```ts
 * import { GraphService } from "@axion/contracts";
 *
 * const graphClient = createServiceClient(GraphService, transport);
 * const response = await graphClient.getProject({ projectId: "123", metadata: {} });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceClient<T extends GenService<any>>(
  service: T,
  transport: Transport
) {
  return createClient(service, transport);
}

/**
 * Create Connect transport and service clients
 */
export function createConnectClient(config: ConnectClientConfig) {
  const transport = createAxionTransport(config);

  return {
    transport,
    config, // Expose config to access getUserId
    /**
     * Create a client for a specific service
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createClient: <T extends GenService<any>>(service: T) =>
      createServiceClient(service, transport),
  };
}

export type ConnectClient = ReturnType<typeof createConnectClient>;
