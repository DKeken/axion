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
import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
} from "@nestjs/common";

import { GraphService } from "@/graph/graph.service";

@Controller("api")
@UseGuards(HttpAuthGuard)
export class GraphHttpController {
  constructor(private readonly graphService: GraphService) {}

  // Projects
  @Get("projects")
  async listProjects(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Query() query?: PaginationQuery
  ) {
    const req: ListProjectsRequest = {
      metadata,
      pagination: normalizePagination(query),
    };
    return this.graphService.listProjects(req);
  }

  @Post("projects")
  async createProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Body() body: Omit<CreateProjectRequest, "metadata">
  ) {
    return this.graphService.createProject({ metadata, ...body });
  }

  @Get("projects/:projectId")
  async getProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string
  ) {
    const req: GetProjectRequest = { metadata, projectId };
    return this.graphService.getProject(req);
  }

  @Patch("projects/:projectId")
  async updateProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string,
    @Body() body: Omit<UpdateProjectRequest, "metadata" | "projectId">
  ) {
    const req: UpdateProjectRequest = { metadata, projectId, ...body };
    return this.graphService.updateProject(req);
  }

  @Delete("projects/:projectId")
  async deleteProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string
  ) {
    const req: DeleteProjectRequest = { metadata, projectId };
    return this.graphService.deleteProject(req);
  }

  // Graph
  @Get("projects/:projectId/graph")
  async getGraph(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string
  ) {
    const req: GetGraphRequest = { metadata, projectId };
    return this.graphService.getGraph(req);
  }

  @Put("projects/:projectId/graph")
  async updateGraph(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string,
    @Body() body: Pick<UpdateGraphRequest, "graphData">
  ) {
    const req: UpdateGraphRequest = { metadata, projectId, ...body };
    return this.graphService.updateGraph(req);
  }

  @Get("projects/:projectId/graph/versions")
  async listGraphVersions(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string,
    @Query() query?: PaginationQuery
  ) {
    const req: ListGraphVersionsRequest = {
      metadata,
      projectId,
      pagination: normalizePagination(query),
    };
    return this.graphService.listGraphVersions(req);
  }

  @Post("projects/:projectId/graph/revert")
  async revertGraphVersion(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string,
    @Body() body: Pick<RevertGraphVersionRequest, "version">
  ) {
    const req: RevertGraphVersionRequest = { metadata, projectId, ...body };
    return this.graphService.revertGraphVersion(req);
  }

  // Services
  @Get("projects/:projectId/services")
  async listServices(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string,
    @Query() query?: PaginationQuery
  ) {
    const req: ListServicesRequest = {
      metadata,
      projectId,
      pagination: normalizePagination(query),
    };
    return this.graphService.listServices(req);
  }

  @Get("projects/:projectId/services/:nodeId")
  async getService(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string,
    @Param("nodeId") nodeId: string
  ) {
    const req: GetServiceRequest = { metadata, projectId, nodeId };
    return this.graphService.getService(req);
  }
}
