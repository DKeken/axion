import type {
  CreateProjectRequest,
  DeleteProjectRequest,
  GetGraphRequest,
  GetProjectRequest,
  GetServiceRequest,
  ListGraphVersionsRequest,
  ListProjectsRequest,
  ListServicesRequest,
  RevertGraphVersionRequest,
  UpdateGraphRequest,
  UpdateProjectRequest,
  RequestMetadata,
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

import { GraphService } from "@/graph/graph.service";

@Controller("api")
@UseGuards(HttpAuthGuard)
export class GraphHttpController {
  constructor(private readonly graphService: GraphService) {}

  // Projects
  @TypedRoute.Get("projects")
  async listProjects(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedQuery() query?: PaginationQuery
  ) {
    const req: ListProjectsRequest = {
      metadata,
      pagination: normalizePagination(query),
    };
    return this.graphService.listProjects(
      typia.assert<ListProjectsRequest>(req)
    );
  }

  @TypedRoute.Post("projects")
  async createProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedBody() body: Omit<CreateProjectRequest, "metadata">
  ) {
    return this.graphService.createProject(
      typia.assert<CreateProjectRequest>({ metadata, ...body })
    );
  }

  @TypedRoute.Get("projects/:projectId")
  async getProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string
  ) {
    const req: GetProjectRequest = { metadata, projectId };
    return this.graphService.getProject(typia.assert<GetProjectRequest>(req));
  }

  @TypedRoute.Patch("projects/:projectId")
  async updateProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string,
    @TypedBody() body: Omit<UpdateProjectRequest, "metadata" | "projectId">
  ) {
    const req: UpdateProjectRequest = { metadata, projectId, ...body };
    return this.graphService.updateProject(
      typia.assert<UpdateProjectRequest>(req)
    );
  }

  @TypedRoute.Delete("projects/:projectId")
  async deleteProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string
  ) {
    const req: DeleteProjectRequest = { metadata, projectId };
    return this.graphService.deleteProject(
      typia.assert<DeleteProjectRequest>(req)
    );
  }

  // Graph
  @TypedRoute.Get("projects/:projectId/graph")
  async getGraph(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string
  ) {
    const req: GetGraphRequest = { metadata, projectId };
    return this.graphService.getGraph(typia.assert<GetGraphRequest>(req));
  }

  @TypedRoute.Put("projects/:projectId/graph")
  async updateGraph(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string,
    @TypedBody() body: Pick<UpdateGraphRequest, "graphData">
  ) {
    const req: UpdateGraphRequest = { metadata, projectId, ...body };
    return this.graphService.updateGraph(typia.assert<UpdateGraphRequest>(req));
  }

  @TypedRoute.Get("projects/:projectId/graph/versions")
  async listGraphVersions(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string,
    @TypedQuery() query?: PaginationQuery
  ) {
    const req: ListGraphVersionsRequest = {
      metadata,
      projectId,
      pagination: normalizePagination(query),
    };
    return this.graphService.listGraphVersions(
      typia.assert<ListGraphVersionsRequest>(req)
    );
  }

  @TypedRoute.Post("projects/:projectId/graph/revert")
  async revertGraphVersion(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string,
    @TypedBody() body: Pick<RevertGraphVersionRequest, "version">
  ) {
    const req: RevertGraphVersionRequest = { metadata, projectId, ...body };
    return this.graphService.revertGraphVersion(
      typia.assert<RevertGraphVersionRequest>(req)
    );
  }

  // Services
  @TypedRoute.Get("projects/:projectId/services")
  async listServices(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string,
    @TypedQuery() query?: PaginationQuery
  ) {
    const req: ListServicesRequest = {
      metadata,
      projectId,
      pagination: normalizePagination(query),
    };
    return this.graphService.listServices(
      typia.assert<ListServicesRequest>(req)
    );
  }

  @TypedRoute.Get("projects/:projectId/services/:nodeId")
  async getService(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string,
    @TypedParam("nodeId") nodeId: string
  ) {
    const req: GetServiceRequest = { metadata, projectId, nodeId };
    return this.graphService.getService(typia.assert<GetServiceRequest>(req));
  }
}
