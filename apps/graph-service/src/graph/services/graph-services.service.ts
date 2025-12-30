import {
  createFullPagination,
  createServiceResponse,
  createListServicesResponse,
  type GetServiceRequest,
  type ListServicesRequest,
} from "@axion/contracts";
import { transformProjectServiceToContract } from "@axion/database";
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable, Inject } from "@nestjs/common";

import { verifyProjectAccess } from "@/graph/helpers/project-access.helper";
import { ProjectRepository } from "@/graph/repositories/project.repository";
import { ServiceRepository } from "@/graph/repositories/service.repository";

@Injectable()
export class GraphServicesService extends BaseService {
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(ServiceRepository)
    private readonly serviceRepository: ServiceRepository
  ) {
    super(GraphServicesService.name);
  }

  @CatchError({ operation: "listing services" })
  async list(data: ListServicesRequest) {
    const access = await verifyProjectAccess(
      this.projectRepository,
      data.projectId,
      data.metadata
    );
    if (!access.success) return access.response;

    const { page, limit } = this.extractPagination(data.pagination);

    const { services, total } = await this.serviceRepository.findByProjectId(
      data.projectId,
      page,
      limit
    );

    return createListServicesResponse(
      services.map(transformProjectServiceToContract),
      createFullPagination({ page, limit }, total)
    );
  }

  @CatchError({ operation: "getting service" })
  async get(data: GetServiceRequest) {
    const access = await verifyProjectAccess(
      this.projectRepository,
      data.projectId,
      data.metadata
    );
    if (!access.success) return access.response;

    const service = await this.serviceRepository.findByProjectIdAndNodeId(
      data.projectId,
      data.nodeId
    );

    if (!service) {
      return this.createNotFoundResponse("Service", data.nodeId);
    }

    return createServiceResponse(transformProjectServiceToContract(service));
  }
}
