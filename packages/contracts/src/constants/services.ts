/**
 * Service names constants
 * Used for Traefik routing, service discovery, and inter-service communication
 */

export const GRAPH_SERVICE_NAME = "graph-service" as const;
export const CODEGEN_SERVICE_NAME = "codegen-service" as const;
export const DEPLOYMENT_SERVICE_NAME = "deployment-service" as const;
export const INFRASTRUCTURE_SERVICE_NAME = "infrastructure-service" as const;
export const BILLING_SERVICE_NAME = "billing-service" as const;
export const AUTH_SERVICE_NAME = "auth-service" as const;

/**
 * All service names as a readonly array
 */
export const ALL_SERVICE_NAMES = [
  GRAPH_SERVICE_NAME,
  CODEGEN_SERVICE_NAME,
  DEPLOYMENT_SERVICE_NAME,
  INFRASTRUCTURE_SERVICE_NAME,
  BILLING_SERVICE_NAME,
  AUTH_SERVICE_NAME,
] as const;

/**
 * Service name type
 */
export type ServiceName = (typeof ALL_SERVICE_NAMES)[number];

