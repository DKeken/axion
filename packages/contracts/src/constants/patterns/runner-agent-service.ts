/**
 * Runner Agent Service MessagePattern constants
 * Used for Kafka communication with Runner Agent
 */

export const RUNNER_AGENT_SERVICE_PATTERNS = {
  /**
   * Registration and management
   */
  REGISTER_AGENT: "runner-agent-service.registerAgent",
  HEARTBEAT: "runner-agent-service.heartbeat",
  GET_AGENT_STATUS: "runner-agent-service.getAgentStatus",
  LIST_AGENTS: "runner-agent-service.listAgents",

  /**
   * Metrics
   */
  SEND_METRICS: "runner-agent-service.sendMetrics",
  STREAM_METRICS: "runner-agent-service.streamMetrics",

  /**
   * Updates
   */
  CHECK_UPDATE: "runner-agent-service.checkUpdate",
  UPDATE_AGENT: "runner-agent-service.updateAgent",

  /**
   * Deployment commands
   */
  DEPLOY_PROJECT: "runner-agent-service.deployProject",
  GET_DEPLOYMENT_STATUS: "runner-agent-service.getDeploymentStatus",
  CANCEL_DEPLOYMENT: "runner-agent-service.cancelDeployment",
  SCALE_SERVICE: "runner-agent-service.scaleService",
  STOP_PROJECT: "runner-agent-service.stopProject",
} as const;

export const RUNNER_AGENT_SERVICE_NAME = "runner-agent-service";
