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
  type InstallAgentRequest,
  type InstallAgentResponse,
  type ConfigureServerRequest,
  type ConfigureServerResponse,
  type GetAgentStatusRequest,
  type AgentStatusResponse,
} from "@axion/contracts";
import { Injectable } from "@nestjs/common";

import { AgentInstallationService } from "@/infrastructure/services/agent-installation.service";
import { AgentStatusService } from "@/infrastructure/services/agent-status.service";
import { ClustersService } from "@/infrastructure/services/clusters.service";
import { ServerConfigurationService } from "@/infrastructure/services/server-configuration.service";
import { ServersService } from "@/infrastructure/services/servers.service";
import { SshKeyRotationService } from "@/infrastructure/services/ssh-key-rotation.service";

/**
 * Main InfrastructureService - координатор, делегирует вызовы специализированным сервисам
 */
@Injectable()
export class InfrastructureService {
  constructor(
    private readonly clustersService: ClustersService,
    private readonly serversService: ServersService,
    private readonly agentInstallationService: AgentInstallationService,
    private readonly agentStatusService: AgentStatusService,
    private readonly serverConfigurationService: ServerConfigurationService,
    private readonly sshKeyRotationService: SshKeyRotationService
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

  async installAgent(data: InstallAgentRequest): Promise<InstallAgentResponse> {
    return this.agentInstallationService.installAgent(data);
  }

  async getAgentStatus(
    data: GetAgentStatusRequest
  ): Promise<AgentStatusResponse> {
    return this.agentStatusService.getStatus(data);
  }

  async configureServer(
    data: ConfigureServerRequest
  ): Promise<ConfigureServerResponse> {
    return this.serverConfigurationService.configureServer(data);
  }

  // SSH Key rotation (ops only, not exposed via controller)
  async rotateSshKeys(oldMasterKey: string, newMasterKey: string) {
    return this.sshKeyRotationService.rotateKeys(oldMasterKey, newMasterKey);
  }
}
