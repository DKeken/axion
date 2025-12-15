/**
 * @axion/contracts - Protobuf contracts for Axion Control Plane
 *
 * Main entry point for importing contracts and contract-specific utilities.
 *
 * For shared utilities (helpers, utils), use @axion/shared instead.
 * This package focuses on Protobuf contracts, types, and contract-specific utilities.
 */

// Export constants
export * from "./constants/index";
export { GRAPH_SERVICE_PATTERNS } from "./constants/patterns/graph-service";
export { CODEGEN_SERVICE_PATTERNS } from "./constants/patterns/codegen-service";
export { INFRASTRUCTURE_SERVICE_PATTERNS } from "./constants/patterns/infrastructure-service";
export { DEPLOYMENT_SERVICE_PATTERNS } from "./constants/patterns/deployment-service";
export { SortOrder, PAGINATION_DEFAULTS } from "./constants/index";

// Export contract utilities
export * from "./contract-utils";
export * from "./utils/index";
export * from "./utils/infrastructure-responses";
export * from "./utils/deployment-responses";
export * from "./helpers/index";

// Export contract validation and discovery
export * from "./validation/index";

// Export types (base contract types)
export * from "./types/index";

// Re-export generated types from Protobuf
export type {
  GraphData,
  Node,
  Edge,
  NodeData,
  Position,
  GraphVersion,
} from "../generated/graph/graph";

// Re-export Request/Response types from Protobuf
export type {
  CreateProjectRequest,
  GetProjectRequest,
  UpdateProjectRequest,
  DeleteProjectRequest,
  ListProjectsRequest,
  ProjectResponse,
  ListProjectsResponse,
  ListProjectsData,
  Project,
} from "../generated/graph/projects";

export type {
  GetGraphRequest,
  UpdateGraphRequest,
  ListGraphVersionsRequest,
  RevertGraphVersionRequest,
  GraphResponse,
  ListGraphVersionsResponse,
  ListGraphVersionsData,
} from "../generated/graph/graph";

export type {
  ListServicesRequest,
  GetServiceRequest,
  ServiceResponse,
  ListServicesResponse,
  ListServicesData,
  ProjectService,
} from "../generated/graph/services";

export type {
  SyncGraphWithServicesRequest,
  ValidateGraphRequest,
} from "../generated/graph/sync";

// Re-export Codegen Service types
export type {
  GenerateProjectRequest,
  GenerateServiceRequest,
  GenerateProjectResponse,
  GenerateServiceResponse,
  GenerateProjectData,
  GenerationResult,
  ValidationError,
} from "../generated/codegen/generation";

export type {
  ValidateProjectRequest,
  ValidateServiceRequest,
  ValidateProjectResponse,
  ValidateServiceResponse,
  ValidateProjectData,
  ValidationResult,
  ValidationLevelResults,
} from "../generated/codegen/validation";

export type {
  ListBlueprintsRequest,
  GetBlueprintRequest,
  BlueprintResponse,
  ListBlueprintsResponse,
  ListBlueprintsData,
  Blueprint,
  BlueprintStructure,
  BlueprintInfrastructure,
  BlueprintContracts,
} from "../generated/codegen/blueprints";

export type {
  DiscoverContractsRequest,
  DiscoverContractsResponse,
  DiscoverContractsData,
  DiscoveredContract,
  ValidateContractsRequest,
  ValidateContractsResponse,
  ValidateContractsData,
  ContractValidationError,
  ContractValidationWarning,
} from "../generated/codegen/contracts";

// Re-export common types
export type { Error } from "../generated/common/common";
// Pagination is exported from utils/pagination.ts
// Export extended RequestMetadata from base types (includes index signature)
export type { RequestMetadata } from "./types/base";

// Re-export enums from Protobuf
export {
  Status,
  ServiceStatus,
  NodeType,
  EdgeType,
  ContractErrorType,
  ValidationStatus,
  ValidationLevel,
  BlueprintCategory,
  DatabaseType,
  CacheType,
  QueueType,
} from "../generated/common/common";

export { HealthStatus } from "../generated/common/health";

// Re-export Infrastructure Service types
export type {
  CreateServerRequest,
  GetServerRequest,
  UpdateServerRequest,
  DeleteServerRequest,
  ListServersRequest,
  ServerResponse,
  ListServersResponse,
  ListServersData,
  Server,
  ServerInfo,
  TestServerConnectionRequest,
  TestServerConnectionResponse,
  ServerConnectionTestResult,
  ServerConnectionInfo,
  ConfigureServerRequest,
  ConfigureServerResponse,
  ServerConfigurationResult,
} from "../generated/infrastructure/servers";

export type {
  CreateClusterRequest,
  GetClusterRequest,
  UpdateClusterRequest,
  DeleteClusterRequest,
  ListClustersRequest,
  ClusterResponse,
  ListClustersResponse,
  ListClustersData,
  Cluster,
  ListClusterServersRequest,
} from "../generated/infrastructure/clusters";

export type {
  InstallAgentRequest,
  InstallAgentResponse,
  AgentInstallationResult,
  GetAgentStatusRequest,
  AgentStatusResponse,
  AgentStatus,
  AgentMetrics,
  DeployedProjectInfo,
} from "../generated/infrastructure/agents";

// Re-export ServerStatus enum
export { ServerStatus } from "../generated/common/common";

// Re-export DeploymentStatus enum
export { DeploymentStatus, DeploymentStage } from "../generated/common/common";

// Re-export Deployment Service types
export type {
  DeployProjectRequest,
  DeployProjectResponse,
  CancelDeploymentRequest,
  ServiceDeploymentStatus,
  DeploymentConfig,
  Deployment,
} from "../generated/deployment/deployment";

export type {
  GetDeploymentRequest,
  ListDeploymentsRequest,
  GetDeploymentStatusRequest,
  DeploymentResponse,
  ListDeploymentsResponse,
  ListDeploymentsData,
  DeploymentStatusResponse,
  DeploymentStatusData,
} from "../generated/deployment/management";

export type {
  RollbackDeploymentRequest,
  RollbackDeploymentResponse,
} from "../generated/deployment/rollback";
