// ============================================================================
// Common types
// ============================================================================

export type {
  RequestMetadata,
  Pagination,
  Empty,
} from "../generated/common/common_pb";

// Export schemas for message creation
export {
  RequestMetadataSchema,
  PaginationSchema,
} from "../generated/common/common_pb";

export { ErrorCode, ErrorSchema } from "../generated/common/errors_pb";
export type { Error } from "../generated/common/errors_pb";

export { ServiceResponseSchema } from "../generated/common/responses_pb";
export type { ServiceResponse } from "../generated/common/responses_pb";

// ============================================================================
// Graph Service
// ============================================================================

export { NodeType, EdgeType, ServiceStatus } from "../generated/graph/graph_pb";

export type {
  Position,
  NodeData,
  Node,
  Edge,
  GraphData,
  ProjectService,
  GraphVersion,
} from "../generated/graph/graph_pb";

export {
  ProjectServiceSchema,
  GraphVersionSchema,
} from "../generated/graph/graph_pb";

export type {
  Project,
  CreateProjectRequest,
  CreateProjectResponse,
  GetProjectRequest,
  GetProjectResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
  DeleteProjectRequest,
  DeleteProjectResponse,
  ListProjectsRequest,
  ListProjectsResponse,
  ProjectList,
  GetGraphRequest,
  GetGraphResponse,
  UpdateGraphRequest,
  UpdateGraphResponse,
} from "../generated/graph/project_pb";

export {
  ProjectSchema,
  CreateProjectRequestSchema,
  CreateProjectResponseSchema,
  GetProjectRequestSchema,
  GetProjectResponseSchema,
  UpdateProjectRequestSchema,
  UpdateProjectResponseSchema,
  DeleteProjectRequestSchema,
  DeleteProjectResponseSchema,
  ListProjectsRequestSchema,
  ListProjectsResponseSchema,
  ProjectListSchema,
  GetGraphRequestSchema,
  GetGraphResponseSchema,
  UpdateGraphRequestSchema,
  UpdateGraphResponseSchema,
} from "../generated/graph/project_pb";

// Connect-RPC service
export { GraphService } from "../generated/graph/service_pb";

// ============================================================================
// Auth Service
// ============================================================================

export type {
  User,
  Session,
  ValidateSessionRequest,
  ValidateSessionResponse,
  SessionValidation,
  CreateSessionRequest,
  CreateSessionResponse,
  SessionData,
  RevokeSessionRequest,
  RevokeSessionResponse,
} from "../generated/auth/session_pb";

export {
  UserSchema,
  SessionSchema,
  ValidateSessionRequestSchema,
  ValidateSessionResponseSchema,
  SessionValidationSchema,
  CreateSessionRequestSchema,
  CreateSessionResponseSchema,
  SessionDataSchema,
  RevokeSessionRequestSchema,
  RevokeSessionResponseSchema,
} from "../generated/auth/session_pb";

// Connect-RPC service
export { AuthService } from "../generated/auth/service_pb";

// Auth utilities
export * from "./utils/auth";

// ============================================================================
// Deployment Service
// ============================================================================

export { DeploymentStatus } from "../generated/deployment/deployment_pb";

export type {
  Deployment,
  CreateDeploymentRequest,
  CreateDeploymentResponse,
  GetDeploymentRequest,
  GetDeploymentResponse,
  ListDeploymentsRequest,
  ListDeploymentsResponse,
  DeploymentList,
  CancelDeploymentRequest,
  CancelDeploymentResponse,
} from "../generated/deployment/deployment_pb";

// Connect-RPC service
export { DeploymentService } from "../generated/deployment/service_pb";

// ============================================================================
// Infrastructure Service
// ============================================================================

export {
  ServerStatus,
  AgentStatus,
} from "../generated/infrastructure/server_pb";

export type {
  Cluster,
  Server,
  Agent,
  ServerInfo,
  CreateClusterRequest,
  CreateClusterResponse,
  GetClusterRequest,
  GetClusterResponse,
  ListClustersRequest,
  ListClustersResponse,
  ClusterList,
  UpdateClusterRequest,
  UpdateClusterResponse,
  DeleteClusterRequest,
  DeleteClusterResponse,
  RegisterServerRequest,
  RegisterServerResponse,
  ServerRegistration,
  GetServerRequest,
  GetServerResponse,
  ListServersRequest,
  ListServersResponse,
  ServerList,
  UpdateServerStatusRequest,
  UpdateServerStatusResponse,
  DeleteServerRequest,
  DeleteServerResponse,
  ConfigureServerRequest,
  ConfigureServerResponse,
  TestServerConnectionRequest,
  TestServerConnectionResponse,
} from "../generated/infrastructure/server_pb";

export {
  ClusterSchema,
  ServerSchema,
  AgentSchema,
  ServerInfoSchema,
  CreateClusterRequestSchema,
  CreateClusterResponseSchema,
  GetClusterRequestSchema,
  GetClusterResponseSchema,
  ListClustersRequestSchema,
  ListClustersResponseSchema,
  ClusterListSchema,
  UpdateClusterRequestSchema,
  UpdateClusterResponseSchema,
  DeleteClusterRequestSchema,
  DeleteClusterResponseSchema,
  RegisterServerRequestSchema,
  RegisterServerResponseSchema,
  ServerRegistrationSchema,
  GetServerRequestSchema,
  GetServerResponseSchema,
  ListServersRequestSchema,
  ListServersResponseSchema,
  ServerListSchema,
  UpdateServerStatusRequestSchema,
  UpdateServerStatusResponseSchema,
  DeleteServerRequestSchema,
  DeleteServerResponseSchema,
  ConfigureServerRequestSchema,
  ConfigureServerResponseSchema,
  TestServerConnectionRequestSchema,
  TestServerConnectionResponseSchema,
} from "../generated/infrastructure/server_pb";

// Connect-RPC service
export { InfrastructureService } from "../generated/infrastructure/service_pb";

// ============================================================================
// Codegen Service
// ============================================================================

export {
  BlueprintType,
  TemplateLanguage,
} from "../generated/codegen/blueprint_pb";

export type {
  Blueprint,
  Template,
  GetBlueprintRequest,
  GetBlueprintResponse,
  ListBlueprintsRequest,
  ListBlueprintsResponse,
  BlueprintList,
  GenerateCodeRequest,
  GenerateCodeResponse,
  GeneratedCode,
  CodeFile,
} from "../generated/codegen/blueprint_pb";

// Connect-RPC service
export { CodegenService } from "../generated/codegen/service_pb";

// ============================================================================
// Billing Service
// ============================================================================

export {
  SubscriptionStatus,
  PlanTier,
} from "../generated/billing/subscription_pb";

export type {
  Plan,
  Subscription,
  GetSubscriptionRequest,
  GetSubscriptionResponse,
  SubscriptionDetails,
  ListPlansRequest,
  ListPlansResponse,
  PlanList,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  UpdateSubscriptionRequest,
  UpdateSubscriptionResponse,
} from "../generated/billing/subscription_pb";

// Connect-RPC service
export { BillingService } from "../generated/billing/service_pb";

// ============================================================================
// Utility functions
// ============================================================================

export * from "./utils/metadata";
export * from "./utils/responses";
export * from "./utils/health";
export * from "./utils/service-status";

// Pagination exports (explicit for better tree-shaking)
export {
  createPagination,
  createFullPagination,
  calculateOffset,
  calculateTotalPages,
  extractPagination,
  PAGINATION_DEFAULTS,
  SortOrder,
} from "./utils/pagination";

// ============================================================================
// Constants
// ============================================================================

export * from "./constants/patterns";
export * from "./constants/services";
