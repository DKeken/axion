import {
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
import { Injectable, Inject } from "@nestjs/common";

import { GraphOperationsService } from "@/graph/services/graph-operations.service";
import { GraphServicesService } from "@/graph/services/graph-services.service";
import { GraphSyncService } from "@/graph/services/graph-sync.service";
import { GraphValidationService } from "@/graph/services/graph-validation.service";
import { ProjectsService } from "@/graph/services/projects.service";

/**
 * Main GraphService - координатор, делегирует вызовы специализированным сервисам
 */
@Injectable()
export class GraphService {
  constructor(
    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService,
    @Inject(GraphOperationsService)
    private readonly graphOperationsService: GraphOperationsService,
    @Inject(GraphServicesService)
    private readonly graphServicesService: GraphServicesService,
    @Inject(GraphSyncService)
    private readonly graphSyncService: GraphSyncService,
    @Inject(GraphValidationService)
    private readonly graphValidationService: GraphValidationService
  ) {}

  // Projects
  async createProject(data: CreateProjectRequest) {
    return this.projectsService.create(data);
  }

  async getProject(data: GetProjectRequest) {
    return this.projectsService.get(data);
  }

  async updateProject(data: UpdateProjectRequest) {
    return this.projectsService.update(data);
  }

  async deleteProject(data: DeleteProjectRequest) {
    return this.projectsService.delete(data);
  }

  async listProjects(data: ListProjectsRequest) {
    return this.projectsService.list(data);
  }

  // Graph operations
  async getGraph(data: GetGraphRequest) {
    return this.graphOperationsService.get(data);
  }

  async updateGraph(data: UpdateGraphRequest) {
    return this.graphOperationsService.update(data);
  }

  async listGraphVersions(data: ListGraphVersionsRequest) {
    return this.graphOperationsService.listVersions(data);
  }

  async revertGraphVersion(data: RevertGraphVersionRequest) {
    return this.graphOperationsService.revertVersion(data);
  }

  // Services
  async listServices(data: ListServicesRequest) {
    return this.graphServicesService.list(data);
  }

  async getService(data: GetServiceRequest) {
    return this.graphServicesService.get(data);
  }

  // Sync and validation (synchronous)
  async syncGraphWithServices(data: SyncGraphWithServicesRequest) {
    return this.graphSyncService.sync(data);
  }

  async validateGraph(data: ValidateGraphRequest) {
    return this.graphValidationService.validate(data);
  }
}
