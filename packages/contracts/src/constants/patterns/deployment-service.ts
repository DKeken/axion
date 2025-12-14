/**
 * Deployment Service message pattern constants
 * Format: {service-name}.{action}
 */

export const DEPLOYMENT_SERVICE_PATTERNS = {
  DEPLOY_PROJECT: "deployment-service.deployProject",
  CANCEL_DEPLOYMENT: "deployment-service.cancelDeployment",
  GET_DEPLOYMENT: "deployment-service.getDeployment",
  LIST_DEPLOYMENTS: "deployment-service.listDeployments",
  GET_DEPLOYMENT_STATUS: "deployment-service.getDeploymentStatus",
  ROLLBACK_DEPLOYMENT: "deployment-service.rollbackDeployment",
} as const;
