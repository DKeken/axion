/**
 * Graph Service message pattern constants
 * Format: {service-name}.{action}
 */

export const GRAPH_SERVICE_PATTERNS = {
  CREATE_PROJECT: "graph-service.createProject",
  GET_PROJECT: "graph-service.getProject",
  UPDATE_PROJECT: "graph-service.updateProject",
  DELETE_PROJECT: "graph-service.deleteProject",
  LIST_PROJECTS: "graph-service.listProjects",
  GET_GRAPH: "graph-service.getGraph",
  UPDATE_GRAPH: "graph-service.updateGraph",
  LIST_GRAPH_VERSIONS: "graph-service.listGraphVersions",
  REVERT_GRAPH_VERSION: "graph-service.revertGraphVersion",
  LIST_SERVICES: "graph-service.listServices",
  GET_SERVICE: "graph-service.getService",
  SYNC_GRAPH_WITH_SERVICES: "graph-service.syncGraphWithServices",
  VALIDATE_GRAPH: "graph-service.validateGraph",
} as const;
