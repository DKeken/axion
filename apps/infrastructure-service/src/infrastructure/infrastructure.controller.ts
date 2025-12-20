import {
  INFRASTRUCTURE_SERVICE_PATTERNS,
  type CalculateSystemRequirementsRequest,
  type ConfigureServerRequest,
  type CreateClusterRequest,
  type CreateServerRequest,
  type DeleteClusterRequest,
  type DeleteServerRequest,
  type GetAgentStatusRequest,
  type GetClusterRequest,
  type GetServerRequest,
  type InstallAgentRequest,
  type ListClustersRequest,
  type ListClusterServersRequest,
  type ListServersRequest,
  type TestServerConnectionRequest,
  type UpdateClusterRequest,
  type UpdateServerRequest,
} from "@axion/contracts";
import {
  DelegateToService,
  MessagePatternWithLog,
  MicroserviceAuthGuard,
} from "@axion/nestjs-common";
import { Controller, UseGuards } from "@nestjs/common";
import { Payload } from "@nestjs/microservices";

import { InfrastructureService } from "@/infrastructure/infrastructure.service";

@Controller()
@UseGuards(MicroserviceAuthGuard)
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {
    void this.infrastructureService;
  }

  // Clusters
  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.CREATE_CLUSTER)
  @DelegateToService("infrastructureService", "createCluster")
  async createCluster(@Payload() data: CreateClusterRequest) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.GET_CLUSTER)
  @DelegateToService("infrastructureService", "getCluster")
  async getCluster(@Payload() data: GetClusterRequest) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.UPDATE_CLUSTER)
  @DelegateToService("infrastructureService", "updateCluster")
  async updateCluster(@Payload() data: UpdateClusterRequest) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.DELETE_CLUSTER)
  @DelegateToService("infrastructureService", "deleteCluster")
  async deleteCluster(@Payload() data: DeleteClusterRequest) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.LIST_CLUSTERS)
  @DelegateToService("infrastructureService", "listClusters")
  async listClusters(@Payload() data: ListClustersRequest) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.LIST_CLUSTER_SERVERS)
  @DelegateToService("infrastructureService", "listClusterServers")
  async listClusterServers(@Payload() data: ListClusterServersRequest) {
    return data;
  }

  // Servers
  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.CREATE_SERVER)
  @DelegateToService("infrastructureService", "createServer")
  async createServer(@Payload() data: CreateServerRequest) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.GET_SERVER)
  @DelegateToService("infrastructureService", "getServer")
  async getServer(@Payload() data: GetServerRequest) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.UPDATE_SERVER)
  @DelegateToService("infrastructureService", "updateServer")
  async updateServer(@Payload() data: UpdateServerRequest) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.DELETE_SERVER)
  @DelegateToService("infrastructureService", "deleteServer")
  async deleteServer(@Payload() data: DeleteServerRequest) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.LIST_SERVERS)
  @DelegateToService("infrastructureService", "listServers")
  async listServers(@Payload() data: ListServersRequest) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.TEST_SERVER_CONNECTION)
  @DelegateToService("infrastructureService", "testServerConnection")
  async testServerConnection(@Payload() data: TestServerConnectionRequest) {
    return data;
  }

  // Agent Installation
  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.INSTALL_AGENT)
  @DelegateToService("infrastructureService", "installAgent")
  async installAgent(@Payload() data: InstallAgentRequest) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.GET_AGENT_STATUS)
  @DelegateToService("infrastructureService", "getAgentStatus")
  async getAgentStatus(@Payload() data: GetAgentStatusRequest) {
    return data;
  }

  // Server Configuration
  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.CONFIGURE_SERVER)
  @DelegateToService("infrastructureService", "configureServer")
  async configureServer(@Payload() data: ConfigureServerRequest) {
    return data;
  }

  // System requirements
  @MessagePatternWithLog(
    INFRASTRUCTURE_SERVICE_PATTERNS.CALCULATE_SYSTEM_REQUIREMENTS
  )
  @DelegateToService("infrastructureService", "calculateSystemRequirements")
  async calculateSystemRequirements(
    @Payload() data: CalculateSystemRequirementsRequest
  ) {
    return data;
  }
}
