import {
  createFullPagination,
  createProjectResponse,
  createListProjectsResponse,
  type CreateProjectRequest,
  type DeleteProjectRequest,
  type GetProjectRequest,
  type ListProjectsRequest,
  type UpdateProjectRequest,
} from "@axion/contracts";
import { transformProjectToContract } from "@axion/database";
import { CatchError } from "@axion/nestjs-common";
import { BaseService, enforceLimit } from "@axion/shared";
import { Injectable, Inject } from "@nestjs/common";

import { env } from "@/config/env";
import { verifyProjectAccess } from "@/graph/helpers/project-access.helper";
import { ProjectRepository } from "@/graph/repositories/project.repository";
import { GraphRepository } from "@/graph/repositories/graph.repository";

@Injectable()
export class ProjectsService extends BaseService {
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(GraphRepository)
    private readonly graphRepository: GraphRepository
  ) {
    super(ProjectsService.name);
  }

  @CatchError({ operation: "creating project" })
  async create(data: CreateProjectRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    const projectsCount = await this.projectRepository.countByUserId(
      metadataCheck.userId
    );
    const limitCheck = enforceLimit(
      "projects",
      projectsCount,
      env.maxProjectsPerUser
    );
    if (!limitCheck.success) return limitCheck.response;

    const project = await this.projectRepository.create({
      userId: metadataCheck.userId,
      name: data.name,
      ...(data.infrastructureConfig &&
        Object.keys(data.infrastructureConfig).length > 0 && {
          infrastructureConfig: data.infrastructureConfig,
        }),
      graphVersion: 1,
    });

    // Create initial empty graph version
    await this.graphRepository.create({
      projectId: project.id,
      version: 1,
      graphData: { nodes: [], edges: [] },
    });

    return createProjectResponse(transformProjectToContract(project));
  }

  @CatchError({ operation: "getting project" })
  async get(data: GetProjectRequest) {
    const access = await verifyProjectAccess(
      this.projectRepository,
      data.projectId,
      data.metadata
    );
    if (!access.success) return access.response;

    const project = await this.projectRepository.findById(data.projectId);
    if (!project) {
      return this.createNotFoundResponse("Project", data.projectId);
    }

    return createProjectResponse(transformProjectToContract(project));
  }

  @CatchError({ operation: "updating project" })
  async update(data: UpdateProjectRequest) {
    const access = await verifyProjectAccess(
      this.projectRepository,
      data.projectId,
      data.metadata
    );
    if (!access.success) return access.response;

    const updated = await this.projectRepository.update(data.projectId, {
      ...(data.name && { name: data.name }),
      ...(data.infrastructureConfig &&
        Object.keys(data.infrastructureConfig).length > 0 && {
          infrastructureConfig: data.infrastructureConfig,
        }),
    });

    if (!updated) {
      return this.createNotFoundResponse("Project", data.projectId);
    }

    return createProjectResponse(transformProjectToContract(updated));
  }

  @CatchError({ operation: "deleting project" })
  async delete(data: DeleteProjectRequest) {
    const access = await verifyProjectAccess(
      this.projectRepository,
      data.projectId,
      data.metadata
    );
    if (!access.success) return access.response;

    await this.projectRepository.delete(data.projectId);
    return createProjectResponse();
  }

  @CatchError({ operation: "listing projects" })
  async list(data: ListProjectsRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    const { page, limit } = this.extractPagination(data.pagination);

    const { projects, total } = await this.projectRepository.findByUserId(
      metadataCheck.userId,
      page,
      limit
    );

    return createListProjectsResponse(
      projects.map(transformProjectToContract),
      createFullPagination({ page, limit }, total)
    );
  }
}
