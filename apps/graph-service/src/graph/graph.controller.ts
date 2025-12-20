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
  createTypiaAssertPipe,
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
  async createProject(
    @Payload(createTypiaAssertPipe<CreateProjectRequest>())
    data: CreateProjectRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.GET_PROJECT)
  @DelegateToService("graphService", "getProject")
  async getProject(
    @Payload(createTypiaAssertPipe<GetProjectRequest>())
    data: GetProjectRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.UPDATE_PROJECT)
  @DelegateToService("graphService", "updateProject")
  async updateProject(
    @Payload(createTypiaAssertPipe<UpdateProjectRequest>())
    data: UpdateProjectRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.DELETE_PROJECT)
  @DelegateToService("graphService", "deleteProject")
  async deleteProject(
    @Payload(createTypiaAssertPipe<DeleteProjectRequest>())
    data: DeleteProjectRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.LIST_PROJECTS)
  @DelegateToService("graphService", "listProjects")
  async listProjects(
    @Payload(createTypiaAssertPipe<ListProjectsRequest>())
    data: ListProjectsRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.GET_GRAPH)
  @DelegateToService("graphService", "getGraph")
  async getGraph(
    @Payload(createTypiaAssertPipe<GetGraphRequest>())
    data: GetGraphRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.UPDATE_GRAPH)
  @DelegateToService("graphService", "updateGraph")
  async updateGraph(
    @Payload(createTypiaAssertPipe<UpdateGraphRequest>())
    data: UpdateGraphRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.LIST_GRAPH_VERSIONS)
  @DelegateToService("graphService", "listGraphVersions")
  async listGraphVersions(
    @Payload(createTypiaAssertPipe<ListGraphVersionsRequest>())
    data: ListGraphVersionsRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.REVERT_GRAPH_VERSION)
  @DelegateToService("graphService", "revertGraphVersion")
  async revertGraphVersion(
    @Payload(createTypiaAssertPipe<RevertGraphVersionRequest>())
    data: RevertGraphVersionRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.LIST_SERVICES)
  @DelegateToService("graphService", "listServices")
  async listServices(
    @Payload(createTypiaAssertPipe<ListServicesRequest>())
    data: ListServicesRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.GET_SERVICE)
  @DelegateToService("graphService", "getService")
  async getService(
    @Payload(createTypiaAssertPipe<GetServiceRequest>())
    data: GetServiceRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.SYNC_GRAPH_WITH_SERVICES)
  @DelegateToService("graphService", "syncGraphWithServices")
  async syncGraphWithServices(
    @Payload(createTypiaAssertPipe<SyncGraphWithServicesRequest>())
    data: SyncGraphWithServicesRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(GRAPH_SERVICE_PATTERNS.VALIDATE_GRAPH)
  @DelegateToService("graphService", "validateGraph")
  async validateGraph(
    @Payload(createTypiaAssertPipe<ValidateGraphRequest>())
    data: ValidateGraphRequest
  ) {
    return data;
  }
}
