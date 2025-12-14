/**
 * Services configuration for Traefik routing
 */

import {
  GRAPH_SERVICE_NAME,
  CODEGEN_SERVICE_NAME,
  DEPLOYMENT_SERVICE_NAME,
  INFRASTRUCTURE_SERVICE_NAME,
  BILLING_SERVICE_NAME,
} from "@axion/contracts";

export interface ServiceConfig {
  serviceName: string;
  dockerServiceName: string;
  routerName: string;
  host: string; // For backward compatibility, can be used for Host-based routing
  port: number;
  websocket?: boolean;
  https?: boolean;
  entrypoints?: string[];
  pathPrefix?: string; // Path prefix for path-based routing (e.g., "graph" for /api/v1/graph)
  stripPrefix?: boolean; // Whether to strip path prefix before forwarding to service
}

export const SERVICES_CONFIG: Record<string, ServiceConfig> = {
  [GRAPH_SERVICE_NAME]: {
    serviceName: GRAPH_SERVICE_NAME,
    dockerServiceName: "graph-service",
    routerName: "graph",
    host: "graph.localhost", // For backward compatibility
    port: 3001,
    websocket: true,
    pathPrefix: "graph", // Path: /api/v1/graph/*
    stripPrefix: true, // Strip /api/v1/graph before forwarding
  },
  [CODEGEN_SERVICE_NAME]: {
    serviceName: CODEGEN_SERVICE_NAME,
    dockerServiceName: "codegen-service",
    routerName: "codegen",
    host: "codegen.localhost",
    port: 3002,
    pathPrefix: "codegen",
    stripPrefix: true,
  },
  [DEPLOYMENT_SERVICE_NAME]: {
    serviceName: DEPLOYMENT_SERVICE_NAME,
    dockerServiceName: "deployment-service",
    routerName: "deployment",
    host: "deployment.localhost",
    port: 3003,
    pathPrefix: "deployment",
    stripPrefix: true,
  },
  [INFRASTRUCTURE_SERVICE_NAME]: {
    serviceName: INFRASTRUCTURE_SERVICE_NAME,
    dockerServiceName: "infrastructure-service",
    routerName: "infrastructure",
    host: "infrastructure.localhost",
    port: 3004,
    pathPrefix: "infrastructure",
    stripPrefix: true,
  },
  [BILLING_SERVICE_NAME]: {
    serviceName: BILLING_SERVICE_NAME,
    dockerServiceName: "billing-service",
    routerName: "billing",
    host: "billing.localhost",
    port: 3006,
    pathPrefix: "billing",
    stripPrefix: true,
  },
};

export function getAllServiceConfigs(): ServiceConfig[] {
  return Object.values(SERVICES_CONFIG);
}
