/**
 * Gateway Service message pattern constants
 * Format: {service-name}.{action}
 */

export const GATEWAY_SERVICE_PATTERNS = {
  REGISTER_SERVICE: "gateway-service.registerService",
  UNREGISTER_SERVICE: "gateway-service.unregisterService",
  HEARTBEAT: "gateway-service.heartbeat",
  DISCOVER_SERVICE: "gateway-service.discoverService",
  LIST_SERVICES: "gateway-service.listServices",
  ROUTE_REQUEST: "gateway-service.routeRequest",
} as const;
