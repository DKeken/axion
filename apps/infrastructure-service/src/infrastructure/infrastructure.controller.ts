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
  createTypiaAssertPipe,
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
  async createCluster(
    @Payload(createTypiaAssertPipe<CreateClusterRequest>())
    data: CreateClusterRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.GET_CLUSTER)
  @DelegateToService("infrastructureService", "getCluster")
  async getCluster(
    @Payload(createTypiaAssertPipe<GetClusterRequest>())
    data: GetClusterRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.UPDATE_CLUSTER)
  @DelegateToService("infrastructureService", "updateCluster")
  async updateCluster(
    @Payload(createTypiaAssertPipe<UpdateClusterRequest>())
    data: UpdateClusterRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.DELETE_CLUSTER)
  @DelegateToService("infrastructureService", "deleteCluster")
  async deleteCluster(
    @Payload(createTypiaAssertPipe<DeleteClusterRequest>())
    data: DeleteClusterRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.LIST_CLUSTERS)
  @DelegateToService("infrastructureService", "listClusters")
  async listClusters(
    @Payload(createTypiaAssertPipe<ListClustersRequest>())
    data: ListClustersRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.LIST_CLUSTER_SERVERS)
  @DelegateToService("infrastructureService", "listClusterServers")
  async listClusterServers(
    @Payload(createTypiaAssertPipe<ListClusterServersRequest>())
    data: ListClusterServersRequest
  ) {
    return data;
  }

  // Servers
  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.CREATE_SERVER)
  @DelegateToService("infrastructureService", "createServer")
  async createServer(
    @Payload(createTypiaAssertPipe<CreateServerRequest>())
    data: CreateServerRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.GET_SERVER)
  @DelegateToService("infrastructureService", "getServer")
  async getServer(
    @Payload(createTypiaAssertPipe<GetServerRequest>())
    data: GetServerRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.UPDATE_SERVER)
  @DelegateToService("infrastructureService", "updateServer")
  async updateServer(
    @Payload(createTypiaAssertPipe<UpdateServerRequest>())
    data: UpdateServerRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.DELETE_SERVER)
  @DelegateToService("infrastructureService", "deleteServer")
  async deleteServer(
    @Payload(createTypiaAssertPipe<DeleteServerRequest>())
    data: DeleteServerRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.LIST_SERVERS)
  @DelegateToService("infrastructureService", "listServers")
  async listServers(
    @Payload(createTypiaAssertPipe<ListServersRequest>())
    data: ListServersRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.TEST_SERVER_CONNECTION)
  @DelegateToService("infrastructureService", "testServerConnection")
  async testServerConnection(
    @Payload(createTypiaAssertPipe<TestServerConnectionRequest>())
    data: TestServerConnectionRequest
  ) {
    return data;
  }

  // Agent Installation
  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.INSTALL_AGENT)
  @DelegateToService("infrastructureService", "installAgent")
  async installAgent(
    @Payload(createTypiaAssertPipe<InstallAgentRequest>())
    data: InstallAgentRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.GET_AGENT_STATUS)
  @DelegateToService("infrastructureService", "getAgentStatus")
  async getAgentStatus(
    @Payload(createTypiaAssertPipe<GetAgentStatusRequest>())
    data: GetAgentStatusRequest
  ) {
    return data;
  }

  // Server Configuration
  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.CONFIGURE_SERVER)
  @DelegateToService("infrastructureService", "configureServer")
  async configureServer(
    @Payload(createTypiaAssertPipe<ConfigureServerRequest>())
    data: ConfigureServerRequest
  ) {
    return data;
  }

  // System requirements
  @MessagePatternWithLog(
    INFRASTRUCTURE_SERVICE_PATTERNS.CALCULATE_SYSTEM_REQUIREMENTS
  )
  @DelegateToService("infrastructureService", "calculateSystemRequirements")
  async calculateSystemRequirements(
    @Payload(createTypiaAssertPipe<CalculateSystemRequirementsRequest>())
    data: CalculateSystemRequirementsRequest
  ) {
    return data;
  }
}
