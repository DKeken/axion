import {
  GRAPH_SERVICE_PATTERNS,
  type CreateProjectRequest,
  type DeleteProjectRequest,
  type GetGraphRequest,
  type GetProjectRequest,
  type GetServiceRequest,
  type ListGraphVersionsRequest,
  type ListProjectsRequest,
  type ListServicesRequest,
  type RevertGraphVersionRequest,
  type SyncGraphWithServicesRequest,
  type UpdateGraphRequest,
  type UpdateProjectRequest,
  type ValidateGraphRequest,
} from "@axion/contracts";
import {
  MessagePatternWithLog,
  MicroserviceAuthGuard,
} from "@axion/nestjs-common";
import { Controller, UseGuards } from "@nestjs/common";
import { Payload } from "@nestjs/microservices";

import { GraphService } from "@/graph/graph.service";

@Controller()
@UseGuards(MicroserviceAuthGuard)
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
  async createProject(@Payload() data: CreateProjectRequest) {
    return this.graphService.createProject(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.GET_PROJECT)
  async getProject(@Payload() data: GetProjectRequest) {
    return this.graphService.getProject(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.UPDATE_PROJECT)
  async updateProject(@Payload() data: UpdateProjectRequest) {
    return this.graphService.updateProject(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.DELETE_PROJECT)
  async deleteProject(@Payload() data: DeleteProjectRequest) {
    return this.graphService.deleteProject(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.LIST_PROJECTS)
  async listProjects(@Payload() data: ListProjectsRequest) {
    return this.graphService.listProjects(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.GET_GRAPH)
  async getGraph(@Payload() data: GetGraphRequest) {
    return this.graphService.getGraph(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.UPDATE_GRAPH)
  async updateGraph(@Payload() data: UpdateGraphRequest) {
    return this.graphService.updateGraph(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.LIST_GRAPH_VERSIONS)
  async listGraphVersions(@Payload() data: ListGraphVersionsRequest) {
    return this.graphService.listGraphVersions(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.REVERT_GRAPH_VERSION)
  async revertGraphVersion(@Payload() data: RevertGraphVersionRequest) {
    return this.graphService.revertGraphVersion(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.LIST_SERVICES)
  async listServices(@Payload() data: ListServicesRequest) {
    return this.graphService.listServices(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.GET_SERVICE)
  async getService(@Payload() data: GetServiceRequest) {
    return this.graphService.getService(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.SYNC_GRAPH_WITH_SERVICES)
  async syncGraphWithServices(@Payload() data: SyncGraphWithServicesRequest) {
    return this.graphService.syncGraphWithServices(data);
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.VALIDATE_GRAPH)
  async validateGraph(@Payload() data: ValidateGraphRequest) {
    return this.graphService.validateGraph(data);
  }
}
