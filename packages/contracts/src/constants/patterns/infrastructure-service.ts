/**
 * Infrastructure Service message pattern constants
 * Format: {service-name}.{action}
 */

export const INFRASTRUCTURE_SERVICE_PATTERNS = {
  CREATE_CLUSTER: "infrastructure-service.createCluster",
  GET_CLUSTER: "infrastructure-service.getCluster",
  UPDATE_CLUSTER: "infrastructure-service.updateCluster",
  DELETE_CLUSTER: "infrastructure-service.deleteCluster",
  LIST_CLUSTERS: "infrastructure-service.listClusters",
  LIST_CLUSTER_SERVERS: "infrastructure-service.listClusterServers",
  CREATE_SERVER: "infrastructure-service.createServer",
  GET_SERVER: "infrastructure-service.getServer",
  UPDATE_SERVER: "infrastructure-service.updateServer",
  DELETE_SERVER: "infrastructure-service.deleteServer",
  LIST_SERVERS: "infrastructure-service.listServers",
  TEST_SERVER_CONNECTION: "infrastructure-service.testServerConnection",
  INSTALL_AGENT: "infrastructure-service.installAgent",
  GET_AGENT_STATUS: "infrastructure-service.getAgentStatus",
  CONFIGURE_SERVER: "infrastructure-service.configureServer",
  CALCULATE_SYSTEM_REQUIREMENTS:
    "infrastructure-service.calculateSystemRequirements",
} as const;
