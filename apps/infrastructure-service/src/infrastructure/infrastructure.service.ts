import {
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
import { Injectable } from "@nestjs/common";

import { ClustersService } from "@/infrastructure/services/clusters.service";
import { ServersService } from "@/infrastructure/services/servers.service";

/**
 * Main InfrastructureService - координатор, делегирует вызовы специализированным сервисам
 */
@Injectable()
export class InfrastructureService {
  constructor(
    private readonly clustersService: ClustersService,
    private readonly serversService: ServersService
  ) {}

  // Clusters
  async createCluster(data: CreateClusterRequest) {
    return this.clustersService.create(data);
  }

  async getCluster(data: GetClusterRequest) {
    return this.clustersService.get(data);
  }

  async updateCluster(data: UpdateClusterRequest) {
    return this.clustersService.update(data);
  }

  async deleteCluster(data: DeleteClusterRequest) {
    return this.clustersService.delete(data);
  }

  async listClusters(data: ListClustersRequest) {
    return this.clustersService.list(data);
  }

  async listClusterServers(data: ListClusterServersRequest) {
    return this.clustersService.listClusterServers(data);
  }

  // Servers
  async createServer(data: CreateServerRequest) {
    return this.serversService.create(data);
  }

  async getServer(data: GetServerRequest) {
    return this.serversService.get(data);
  }

  async updateServer(data: UpdateServerRequest) {
    return this.serversService.update(data);
  }

  async deleteServer(data: DeleteServerRequest) {
    return this.serversService.delete(data);
  }

  async listServers(data: ListServersRequest) {
    return this.serversService.list(data);
  }

  async testServerConnection(data: TestServerConnectionRequest) {
    return this.serversService.testConnection(data);
  }
}
