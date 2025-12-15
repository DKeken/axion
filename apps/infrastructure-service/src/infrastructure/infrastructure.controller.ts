import {
  INFRASTRUCTURE_SERVICE_PATTERNS,
  type CreateClusterRequest,
  type DeleteClusterRequest,
  type GetClusterRequest,
  type ListClustersRequest,
  type UpdateClusterRequest,
  type ListClusterServersRequest,
  type CreateServerRequest,
  type DeleteServerRequest,
  type GetServerRequest,
  type ListServersRequest,
  type UpdateServerRequest,
  type TestServerConnectionRequest,
} from "@axion/contracts";
import {
  MessagePatternWithLog,
  MicroserviceAuthGuard,
} from "@axion/nestjs-common";
import { Controller, UseGuards } from "@nestjs/common";
import { Payload } from "@nestjs/microservices";

import { InfrastructureService } from "@/infrastructure/infrastructure.service";

@Controller()
@UseGuards(MicroserviceAuthGuard)
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  // Clusters
  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.CREATE_CLUSTER)
  async createCluster(@Payload() data: CreateClusterRequest) {
    return this.infrastructureService.createCluster(data);
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.GET_CLUSTER)
  async getCluster(@Payload() data: GetClusterRequest) {
    return this.infrastructureService.getCluster(data);
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.UPDATE_CLUSTER)
  async updateCluster(@Payload() data: UpdateClusterRequest) {
    return this.infrastructureService.updateCluster(data);
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.DELETE_CLUSTER)
  async deleteCluster(@Payload() data: DeleteClusterRequest) {
    return this.infrastructureService.deleteCluster(data);
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.LIST_CLUSTERS)
  async listClusters(@Payload() data: ListClustersRequest) {
    return this.infrastructureService.listClusters(data);
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.LIST_CLUSTER_SERVERS)
  async listClusterServers(@Payload() data: ListClusterServersRequest) {
    return this.infrastructureService.listClusterServers(data);
  }

  // Servers
  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.CREATE_SERVER)
  async createServer(@Payload() data: CreateServerRequest) {
    return this.infrastructureService.createServer(data);
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.GET_SERVER)
  async getServer(@Payload() data: GetServerRequest) {
    return this.infrastructureService.getServer(data);
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.UPDATE_SERVER)
  async updateServer(@Payload() data: UpdateServerRequest) {
    return this.infrastructureService.updateServer(data);
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.DELETE_SERVER)
  async deleteServer(@Payload() data: DeleteServerRequest) {
    return this.infrastructureService.deleteServer(data);
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.LIST_SERVERS)
  async listServers(@Payload() data: ListServersRequest) {
    return this.infrastructureService.listServers(data);
  }

  @MessagePatternWithLog(INFRASTRUCTURE_SERVICE_PATTERNS.TEST_SERVER_CONNECTION)
  async testServerConnection(@Payload() data: TestServerConnectionRequest) {
    return this.infrastructureService.testServerConnection(data);
  }
}
