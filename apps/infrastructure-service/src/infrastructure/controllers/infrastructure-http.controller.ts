import type {
  CalculateSystemRequirementsRequest,
  ConfigureServerRequest,
  CreateClusterRequest,
  CreateServerRequest,
  DeleteClusterRequest,
  DeleteServerRequest,
  GetAgentStatusRequest,
  GetClusterRequest,
  GetServerRequest,
  InstallAgentRequest,
  ListClustersRequest,
  ListClusterServersRequest,
  ListServersRequest,
  RequestMetadata,
  TestServerConnectionRequest,
  UpdateClusterRequest,
  UpdateServerRequest,
} from "@axion/contracts";
import {
  AxionRequestMetadata,
  HttpAuthGuard,
  normalizePagination,
  type PaginationQuery,
} from "@axion/nestjs-common";
import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
} from "@nestjs/common";

import { InfrastructureService } from "@/infrastructure/infrastructure.service";

@Controller("api")
@UseGuards(HttpAuthGuard)
export class InfrastructureHttpController {
  constructor(
    @Inject(InfrastructureService)
    private readonly infrastructureService: InfrastructureService
  ) {}

  // Servers
  @Get("servers")
  async listServers(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Query() query?: { clusterId?: string } & PaginationQuery
  ) {
    const req: ListServersRequest = {
      metadata,
      ...(query?.clusterId ? { clusterId: query.clusterId } : {}),
      pagination: normalizePagination(query),
    };
    return this.infrastructureService.listServers(req);
  }

  @Post("servers")
  async createServer(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Body() body: Omit<CreateServerRequest, "metadata">
  ) {
    const req: CreateServerRequest = { metadata, ...body };
    return this.infrastructureService.createServer(req);
  }

  @Get("servers/:serverId")
  async getServer(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("serverId") serverId: string
  ) {
    const req: GetServerRequest = { metadata, serverId };
    return this.infrastructureService.getServer(req);
  }

  @Patch("servers/:serverId")
  async updateServer(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("serverId") serverId: string,
    @Body() body: Omit<UpdateServerRequest, "metadata" | "serverId">
  ) {
    const req: UpdateServerRequest = { metadata, serverId, ...body };
    return this.infrastructureService.updateServer(req);
  }

  @Delete("servers/:serverId")
  async deleteServer(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("serverId") serverId: string
  ) {
    const req: DeleteServerRequest = { metadata, serverId };
    return this.infrastructureService.deleteServer(req);
  }

  @Post("servers/test-ssh")
  async testSsh(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Body() body: Omit<TestServerConnectionRequest, "metadata">
  ) {
    const req: TestServerConnectionRequest = { metadata, ...body };
    return this.infrastructureService.testServerConnection(req);
  }

  @Post("servers/:serverId/configure")
  async configureServer(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("serverId") serverId: string,
    @Body() body: Omit<ConfigureServerRequest, "metadata" | "serverId">
  ) {
    const req: ConfigureServerRequest = { metadata, serverId, ...body };
    return this.infrastructureService.configureServer(req);
  }

  @Post("servers/:serverId/agent/install")
  async installAgent(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("serverId") serverId: string,
    @Body() body: Omit<InstallAgentRequest, "metadata" | "serverId">
  ) {
    const req: InstallAgentRequest = { metadata, serverId, ...body };
    return this.infrastructureService.installAgent(req);
  }

  @Get("servers/:serverId/agent/status")
  async getAgentStatus(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("serverId") serverId: string
  ) {
    const req: GetAgentStatusRequest = { metadata, serverId };
    return this.infrastructureService.getAgentStatus(req);
  }

  @Post("servers/requirements")
  async calculateSystemRequirements(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Body()
    body: Omit<CalculateSystemRequirementsRequest, "metadata">
  ) {
    const req: CalculateSystemRequirementsRequest = { metadata, ...body };
    return this.infrastructureService.calculateSystemRequirements(req);
  }

  // Clusters
  @Get("clusters")
  async listClusters(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Query() query?: PaginationQuery
  ) {
    const req: ListClustersRequest = {
      metadata,
      pagination: normalizePagination(query),
    };
    return this.infrastructureService.listClusters(req);
  }

  @Post("clusters")
  async createCluster(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Body() body: Omit<CreateClusterRequest, "metadata">
  ) {
    const req: CreateClusterRequest = { metadata, ...body };
    return this.infrastructureService.createCluster(req);
  }

  @Get("clusters/:clusterId")
  async getCluster(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("clusterId") clusterId: string
  ) {
    const req: GetClusterRequest = { metadata, clusterId };
    return this.infrastructureService.getCluster(req);
  }

  @Patch("clusters/:clusterId")
  async updateCluster(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("clusterId") clusterId: string,
    @Body() body: Omit<UpdateClusterRequest, "metadata" | "clusterId">
  ) {
    const req: UpdateClusterRequest = { metadata, clusterId, ...body };
    return this.infrastructureService.updateCluster(req);
  }

  @Delete("clusters/:clusterId")
  async deleteCluster(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("clusterId") clusterId: string
  ) {
    const req: DeleteClusterRequest = { metadata, clusterId };
    return this.infrastructureService.deleteCluster(req);
  }

  @Get("clusters/:clusterId/servers")
  async listClusterServers(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("clusterId") clusterId: string,
    @Query() query?: PaginationQuery
  ) {
    const req: ListClusterServersRequest = {
      metadata,
      clusterId,
      pagination: normalizePagination(query),
    };
    return this.infrastructureService.listClusterServers(req);
  }
}
