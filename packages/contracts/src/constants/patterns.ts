/**
 * Kafka MessagePattern константы для Graph Service
 */
export const GRAPH_SERVICE_PATTERNS = {
  CREATE_PROJECT: "graph-service.create-project",
  GET_PROJECT: "graph-service.get-project",
  UPDATE_PROJECT: "graph-service.update-project",
  DELETE_PROJECT: "graph-service.delete-project",
  LIST_PROJECTS: "graph-service.list-projects",
  GET_GRAPH: "graph-service.get-graph",
  UPDATE_GRAPH: "graph-service.update-graph",
} as const;

/**
 * Kafka MessagePattern константы для Auth Service
 */
export const AUTH_SERVICE_PATTERNS = {
  VALIDATE_SESSION: "auth-service.validate-session",
  CREATE_SESSION: "auth-service.create-session",
  REVOKE_SESSION: "auth-service.revoke-session",
} as const;

/**
 * Kafka MessagePattern константы для Deployment Service
 */
export const DEPLOYMENT_SERVICE_PATTERNS = {
  CREATE_DEPLOYMENT: "deployment-service.create-deployment",
  GET_DEPLOYMENT: "deployment-service.get-deployment",
  LIST_DEPLOYMENTS: "deployment-service.list-deployments",
  CANCEL_DEPLOYMENT: "deployment-service.cancel-deployment",
} as const;

/**
 * Kafka MessagePattern константы для Infrastructure Service
 */
export const INFRASTRUCTURE_SERVICE_PATTERNS = {
  REGISTER_SERVER: "infrastructure-service.register-server",
  GET_SERVER: "infrastructure-service.get-server",
  LIST_SERVERS: "infrastructure-service.list-servers",
  UPDATE_SERVER_STATUS: "infrastructure-service.update-server-status",
  DELETE_SERVER: "infrastructure-service.delete-server",
} as const;

/**
 * Kafka MessagePattern константы для Codegen Service
 */
export const CODEGEN_SERVICE_PATTERNS = {
  GET_BLUEPRINT: "codegen-service.get-blueprint",
  LIST_BLUEPRINTS: "codegen-service.list-blueprints",
  GENERATE_CODE: "codegen-service.generate-code",
} as const;

/**
 * Kafka MessagePattern константы для Billing Service
 */
export const BILLING_SERVICE_PATTERNS = {
  GET_SUBSCRIPTION: "billing-service.get-subscription",
  LIST_PLANS: "billing-service.list-plans",
  CREATE_SUBSCRIPTION: "billing-service.create-subscription",
  UPDATE_SUBSCRIPTION: "billing-service.update-subscription",
  CANCEL_SUBSCRIPTION: "billing-service.cancel-subscription",
} as const;

/**
 * Все сервисные паттерны для удобства
 */
export const SERVICE_PATTERNS = {
  GRAPH: GRAPH_SERVICE_PATTERNS,
  AUTH: AUTH_SERVICE_PATTERNS,
  DEPLOYMENT: DEPLOYMENT_SERVICE_PATTERNS,
  INFRASTRUCTURE: INFRASTRUCTURE_SERVICE_PATTERNS,
  CODEGEN: CODEGEN_SERVICE_PATTERNS,
  BILLING: BILLING_SERVICE_PATTERNS,
} as const;
