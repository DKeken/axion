import {
  createFullPagination,
  createGraphResponse,
  createListGraphVersionsResponse,
  type GetGraphRequest,
  type ListGraphVersionsRequest,
  type RevertGraphVersionRequest,
  type UpdateGraphRequest,
} from "@axion/contracts";
import { transformGraphVersionToContract } from "@axion/database";
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable, Inject } from "@nestjs/common";

import { verifyProjectAccess } from "@/graph/helpers/project-access.helper";
import { GraphRepository } from "@/graph/repositories/graph.repository";
import { ProjectRepository } from "@/graph/repositories/project.repository";
import { GraphBroadcastService } from "@/graph/services/graph-broadcast.service";
import { GraphValidationService } from "@/graph/services/graph-validation.service";

@Injectable()
export class GraphOperationsService extends BaseService {
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(GraphRepository)
    private readonly graphRepository: GraphRepository,
    @Inject(GraphValidationService)
    private readonly validationService: GraphValidationService,
    @Inject(GraphBroadcastService)
    private readonly broadcastService: GraphBroadcastService
  ) {
    super(GraphOperationsService.name);
  }

  @CatchError({ operation: "getting graph" })
  async get(data: GetGraphRequest) {
    const access = await verifyProjectAccess(
      this.projectRepository,
      data.projectId,
      data.metadata
    );
    if (!access.success) return access.response;

    const graphVersion = await this.graphRepository.findLatestByProjectId(
      data.projectId
    );

    if (!graphVersion || !graphVersion.graphData) {
      // Check if project exists. If it does, create initial graph on the fly.
      // This handles projects created before the fix in ProjectsService.create.
      const project = await this.projectRepository.findById(data.projectId);
      if (project) {
        this.logger.log(
          `Creating initial graph for project ${data.projectId} on the fly`
        );
        const initialGraphData = { nodes: [], edges: [] };
        const newVersion = await this.graphRepository.create({
          projectId: data.projectId,
          version: project.graphVersion,
          graphData: initialGraphData,
        });
        return createGraphResponse(newVersion.graphData ?? undefined);
      }

      return this.createNotFoundResponse("Graph", data.projectId);
    }

    return createGraphResponse(graphVersion.graphData);
  }

  @CatchError({ operation: "updating graph" })
  async update(data: UpdateGraphRequest) {
    const access = await verifyProjectAccess(
      this.projectRepository,
      data.projectId,
      data.metadata
    );
    if (!access.success) return access.response;

    if (!data.graphData) {
      return this.createValidationResponse("graphData is required");
    }

    // Validate graph structure
    const validation = this.validationService.validateStructure(data.graphData);
    if (!validation.valid) {
      return this.createValidationResponse(validation.errors.join(", "));
    }

    // Increment version
    const updatedProject = await this.projectRepository.incrementGraphVersion(
      data.projectId
    );
    if (!updatedProject) {
      return this.createNotFoundResponse("Project", data.projectId);
    }

    // Create new version
    const graphVersion = await this.graphRepository.create({
      projectId: data.projectId,
      version: updatedProject.graphVersion,
      graphData: data.graphData,
    });

    // Broadcast update via SSE
    if (graphVersion.graphData) {
      this.broadcastService.broadcastGraphUpdate(
        data.projectId,
        graphVersion.graphData
      );
    }

    return createGraphResponse(graphVersion.graphData ?? undefined);
  }

  @CatchError({ operation: "listing graph versions" })
  async listVersions(data: ListGraphVersionsRequest) {
    const access = await verifyProjectAccess(
      this.projectRepository,
      data.projectId,
      data.metadata
    );
    if (!access.success) return access.response;

    const { page, limit } = this.extractPagination(data.pagination);

    const { versions, total } = await this.graphRepository.findByProjectId(
      data.projectId,
      page,
      limit
    );

    return createListGraphVersionsResponse(
      versions.map(transformGraphVersionToContract),
      createFullPagination({ page, limit }, total)
    );
  }

  @CatchError({ operation: "reverting graph version" })
  async revertVersion(data: RevertGraphVersionRequest) {
    const access = await verifyProjectAccess(
      this.projectRepository,
      data.projectId,
      data.metadata
    );
    if (!access.success) return access.response;

    const graphVersion = await this.graphRepository.findByProjectIdAndVersion(
      data.projectId,
      data.version
    );

    if (!graphVersion) {
      return this.createNotFoundResponse("Graph version", `${data.version}`);
    }

    // Create new version with reverted data
    const updatedProject = await this.projectRepository.incrementGraphVersion(
      data.projectId
    );
    if (!updatedProject) {
      return this.createNotFoundResponse("Project", data.projectId);
    }

    if (!graphVersion.graphData) {
      return this.createNotFoundResponse(
        "Graph version data",
        `${data.version}`
      );
    }

    const newVersion = await this.graphRepository.create({
      projectId: data.projectId,
      version: updatedProject.graphVersion,
      graphData: graphVersion.graphData,
    });

    return createGraphResponse(newVersion.graphData ?? undefined);
  }
}
