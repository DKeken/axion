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
  DelegateToService,
  MessagePatternWithLog,
  MicroserviceAuthGuard,
} from "@axion/nestjs-common";
import { Controller, UseGuards } from "@nestjs/common";
import { Payload } from "@nestjs/microservices";

import { GraphService } from "@/graph/graph.service";

@Controller()
@UseGuards(MicroserviceAuthGuard)
export class GraphController {
  constructor(private readonly graphService: GraphService) {
    void this.graphService;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.CREATE_PROJECT)
  @DelegateToService("graphService", "createProject")
  async createProject(@Payload() data: CreateProjectRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.GET_PROJECT)
  @DelegateToService("graphService", "getProject")
  async getProject(@Payload() data: GetProjectRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.UPDATE_PROJECT)
  @DelegateToService("graphService", "updateProject")
  async updateProject(@Payload() data: UpdateProjectRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.DELETE_PROJECT)
  @DelegateToService("graphService", "deleteProject")
  async deleteProject(@Payload() data: DeleteProjectRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.LIST_PROJECTS)
  @DelegateToService("graphService", "listProjects")
  async listProjects(@Payload() data: ListProjectsRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.GET_GRAPH)
  @DelegateToService("graphService", "getGraph")
  async getGraph(@Payload() data: GetGraphRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.UPDATE_GRAPH)
  @DelegateToService("graphService", "updateGraph")
  async updateGraph(@Payload() data: UpdateGraphRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.LIST_GRAPH_VERSIONS)
  @DelegateToService("graphService", "listGraphVersions")
  async listGraphVersions(@Payload() data: ListGraphVersionsRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.REVERT_GRAPH_VERSION)
  @DelegateToService("graphService", "revertGraphVersion")
  async revertGraphVersion(@Payload() data: RevertGraphVersionRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.LIST_SERVICES)
  @DelegateToService("graphService", "listServices")
  async listServices(@Payload() data: ListServicesRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.GET_SERVICE)
  @DelegateToService("graphService", "getService")
  async getService(@Payload() data: GetServiceRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.SYNC_GRAPH_WITH_SERVICES)
  @DelegateToService("graphService", "syncGraphWithServices")
  async syncGraphWithServices(@Payload() data: SyncGraphWithServicesRequest) {
    return data as unknown;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.VALIDATE_GRAPH)
  @DelegateToService("graphService", "validateGraph")
  async validateGraph(@Payload() data: ValidateGraphRequest) {
    return data as unknown;
  }
}
