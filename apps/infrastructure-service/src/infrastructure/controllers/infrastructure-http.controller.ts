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
import { TypedBody, TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, UseGuards } from "@nestjs/common";
import typia from "typia";

import { InfrastructureService } from "@/infrastructure/infrastructure.service";

@Controller("api")
@UseGuards(HttpAuthGuard)
export class InfrastructureHttpController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  // Servers
  @TypedRoute.Get("servers")
  async listServers(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedQuery() query?: { clusterId?: string } & PaginationQuery
  ) {
    const req: ListServersRequest = {
      metadata,
      ...(query?.clusterId ? { clusterId: query.clusterId } : {}),
      pagination: normalizePagination(query),
    };
    return this.infrastructureService.listServers(
      typia.assert<ListServersRequest>(req)
    );
  }

  @TypedRoute.Post("servers")
  async createServer(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedBody() body: Omit<CreateServerRequest, "metadata">
  ) {
    const req: CreateServerRequest = { metadata, ...body };
    return this.infrastructureService.createServer(
      typia.assert<CreateServerRequest>(req)
    );
  }

  @TypedRoute.Get("servers/:serverId")
  async getServer(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("serverId") serverId: string
  ) {
    const req: GetServerRequest = { metadata, serverId };
    return this.infrastructureService.getServer(
      typia.assert<GetServerRequest>(req)
    );
  }

  @TypedRoute.Patch("servers/:serverId")
  async updateServer(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("serverId") serverId: string,
    @TypedBody() body: Omit<UpdateServerRequest, "metadata" | "serverId">
  ) {
    const req: UpdateServerRequest = { metadata, serverId, ...body };
    return this.infrastructureService.updateServer(
      typia.assert<UpdateServerRequest>(req)
    );
  }

  @TypedRoute.Delete("servers/:serverId")
  async deleteServer(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("serverId") serverId: string
  ) {
    const req: DeleteServerRequest = { metadata, serverId };
    return this.infrastructureService.deleteServer(
      typia.assert<DeleteServerRequest>(req)
    );
  }

  @TypedRoute.Post("servers/test-ssh")
  async testSsh(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedBody() body: Omit<TestServerConnectionRequest, "metadata">
  ) {
    const req: TestServerConnectionRequest = { metadata, ...body };
    return this.infrastructureService.testServerConnection(
      typia.assert<TestServerConnectionRequest>(req)
    );
  }

  @TypedRoute.Post("servers/:serverId/configure")
  async configureServer(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("serverId") serverId: string,
    @TypedBody() body: Omit<ConfigureServerRequest, "metadata" | "serverId">
  ) {
    const req: ConfigureServerRequest = { metadata, serverId, ...body };
    return this.infrastructureService.configureServer(
      typia.assert<ConfigureServerRequest>(req)
    );
  }

  @TypedRoute.Post("servers/:serverId/agent/install")
  async installAgent(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("serverId") serverId: string,
    @TypedBody() body: Omit<InstallAgentRequest, "metadata" | "serverId">
  ) {
    const req: InstallAgentRequest = { metadata, serverId, ...body };
    return this.infrastructureService.installAgent(
      typia.assert<InstallAgentRequest>(req)
    );
  }

  @TypedRoute.Get("servers/:serverId/agent/status")
  async getAgentStatus(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("serverId") serverId: string
  ) {
    const req: GetAgentStatusRequest = { metadata, serverId };
    return this.infrastructureService.getAgentStatus(
      typia.assert<GetAgentStatusRequest>(req)
    );
  }

  @TypedRoute.Post("servers/requirements")
  async calculateSystemRequirements(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedBody()
    body: Omit<CalculateSystemRequirementsRequest, "metadata">
  ) {
    const req: CalculateSystemRequirementsRequest = { metadata, ...body };
    return this.infrastructureService.calculateSystemRequirements(
      typia.assert<CalculateSystemRequirementsRequest>(req)
    );
  }

  // Clusters
  @TypedRoute.Get("clusters")
  async listClusters(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedQuery() query?: PaginationQuery
  ) {
    const req: ListClustersRequest = {
      metadata,
      pagination: normalizePagination(query),
    };
    return this.infrastructureService.listClusters(
      typia.assert<ListClustersRequest>(req)
    );
  }

  @TypedRoute.Post("clusters")
  async createCluster(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedBody() body: Omit<CreateClusterRequest, "metadata">
  ) {
    const req: CreateClusterRequest = { metadata, ...body };
    return this.infrastructureService.createCluster(
      typia.assert<CreateClusterRequest>(req)
    );
  }

  @TypedRoute.Get("clusters/:clusterId")
  async getCluster(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("clusterId") clusterId: string
  ) {
    const req: GetClusterRequest = { metadata, clusterId };
    return this.infrastructureService.getCluster(
      typia.assert<GetClusterRequest>(req)
    );
  }

  @TypedRoute.Patch("clusters/:clusterId")
  async updateCluster(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("clusterId") clusterId: string,
    @TypedBody() body: Omit<UpdateClusterRequest, "metadata" | "clusterId">
  ) {
    const req: UpdateClusterRequest = { metadata, clusterId, ...body };
    return this.infrastructureService.updateCluster(
      typia.assert<UpdateClusterRequest>(req)
    );
  }

  @TypedRoute.Delete("clusters/:clusterId")
  async deleteCluster(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("clusterId") clusterId: string
  ) {
    const req: DeleteClusterRequest = { metadata, clusterId };
    return this.infrastructureService.deleteCluster(
      typia.assert<DeleteClusterRequest>(req)
    );
  }

  @TypedRoute.Get("clusters/:clusterId/servers")
  async listClusterServers(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("clusterId") clusterId: string,
    @TypedQuery() query?: PaginationQuery
  ) {
    const req: ListClusterServersRequest = {
      metadata,
      clusterId,
      pagination: normalizePagination(query),
    };
    return this.infrastructureService.listClusterServers(
      typia.assert<ListClusterServersRequest>(req)
    );
  }
}
