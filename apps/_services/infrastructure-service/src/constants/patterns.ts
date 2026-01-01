/**
 * Kafka message patterns for infrastructure service
 * These patterns are used for Kafka transport
 */
export const INFRASTRUCTURE_SERVICE_PATTERNS = {
  REGISTER_SERVER: "infrastructure.registerServer",
  GET_SERVER: "infrastructure.getServer",
  LIST_SERVERS: "infrastructure.listServers",
  UPDATE_SERVER_STATUS: "infrastructure.updateServerStatus",
  DELETE_SERVER: "infrastructure.deleteServer",
  CONFIGURE_SERVER: "infrastructure.configureServer",
  TEST_SERVER_CONNECTION: "infrastructure.testServerConnection",
} as const;

/**
 * Service name for Connect-RPC
 */
export const INFRASTRUCTURE_SERVICE_NAME =
  "axion.infrastructure.v1.InfrastructureService";
