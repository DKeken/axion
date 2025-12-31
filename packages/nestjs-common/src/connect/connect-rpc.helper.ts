import type { IncomingMessage, ServerResponse } from "node:http";

import { connectNodeAdapter } from "@connectrpc/connect-node";
import { Logger } from "@nestjs/common";

import type {
  ConnectRpcOptions,
  ConnectRpcProvider,
} from "./connect-rpc.types";

const logger = new Logger("ConnectRPC");

/**
 * Create a request handler for Connect-RPC with CORS support
 * @param providers Array of controllers implementing ConnectRpcProvider
 * @param options Connect-RPC options
 * @returns Request handler function
 */
export function createConnectRpcHandler(
  providers: ConnectRpcProvider[],
  options: ConnectRpcOptions = {}
) {
  const {
    cors = true,
    corsOrigin = true,
    healthCheck = true,
    healthCheckPath = "/health",
  } = options;

  return async (req: IncomingMessage, res: ServerResponse) => {
    // CORS headers
    if (cors) {
      const origin =
        typeof corsOrigin === "string"
          ? corsOrigin
          : req.headers.origin || "http://localhost:3000";

      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Connect-Protocol-Version, Connect-Timeout-Ms, Authorization, Accept, X-Requested-With"
      );
      res.setHeader(
        "Access-Control-Expose-Headers",
        "Connect-Protocol-Version, Connect-Timeout-Ms"
      );
      res.setHeader("Access-Control-Max-Age", "86400");
    }

    // Handle preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check
    if (healthCheck && req.url === healthCheckPath) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // Connect-RPC handler
    try {
      // Combine all routes from providers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const routes = (router: any) => {
        for (const provider of providers) {
          const routerFn = provider.createRouter();
          routerFn(router);
        }
      };

      await connectNodeAdapter({
        routes,
        fallback: (_req, res) => {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not Found");
        },
      })(req, res);
    } catch (error) {
      logger.error("Error handling Connect-RPC request:", error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  };
}

/**
 * Log Connect-RPC server startup information
 */
export function logConnectRpcStartup(port: number, serviceName: string) {
  logger.log(`Connect-RPC server listening on port ${port}`);
  logger.log(
    `Connect-RPC endpoints: http://localhost:${port}/${serviceName}/*`
  );
}
