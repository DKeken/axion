import {
  type SyncGraphWithServicesRequest,
  createSuccessResponse,
  NodeType,
  PAGINATION_DEFAULTS,
  SERVICE_STATUS_DB,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable, Inject } from "@nestjs/common";

import { verifyProjectAccess } from "@/graph/helpers/project-access.helper";
import { ProjectRepository } from "@/graph/repositories/project.repository";
import { ServiceRepository } from "@/graph/repositories/service.repository";
import { GraphBroadcastService } from "@/graph/services/graph-broadcast.service";
import { SERVICE_CHANGE_EVENT_TYPES } from "@/graph/types/sse-events";

@Injectable()
export class GraphSyncService extends BaseService {
  constructor(
    @Inject(ProjectRepository)
    private readonly projectRepository: ProjectRepository,
    @Inject(ServiceRepository)
    private readonly serviceRepository: ServiceRepository,
    @Inject(GraphBroadcastService)
    private readonly broadcastService: GraphBroadcastService
  ) {
    super(GraphSyncService.name);
  }

  @CatchError({ operation: "syncing graph with services" })
  async sync(data: SyncGraphWithServicesRequest) {
    const access = await verifyProjectAccess(
      this.projectRepository,
      data.projectId,
      data.metadata
    );
    if (!access.success) return access.response;

    if (!data.graphData) {
      return this.createValidationResponse("graphData is required");
    }

    // Extract service nodes from graph
    const serviceNodes = data.graphData.nodes.filter(
      (node) => node.type === NodeType.NODE_TYPE_SERVICE && node.data
    );

    // Get existing services
    const existingServices = await this.serviceRepository.findByProjectId(
      data.projectId,
      PAGINATION_DEFAULTS.DEFAULT_PAGE,
      PAGINATION_DEFAULTS.MAX_LIMIT
    );

    const existingNodeIds = new Set(
      existingServices.services.map((s) => s.nodeId)
    );
    const newNodeIds = new Set(serviceNodes.map((n) => n.id));

    // Find services to create, update, delete
    const toCreate = serviceNodes.filter((n) => !existingNodeIds.has(n.id));
    const toUpdate = serviceNodes.filter((n) => existingNodeIds.has(n.id));
    const toDelete = existingServices.services.filter(
      (s) => !newNodeIds.has(s.nodeId)
    );

    const createdIds: string[] = [];
    const updatedIds: string[] = [];
    const deletedIds: string[] = [];

    // Create new services
    for (const node of toCreate) {
      if (!node.data) continue;
      const service = await this.serviceRepository.create({
        projectId: data.projectId,
        nodeId: node.id,
        serviceName: node.data.serviceName || `service-${node.id}`,
        blueprintId: node.data.blueprintId || "",
        ...(Object.keys(node.data.config || {}).length > 0 && {
          config: node.data.config,
        }),
        status: SERVICE_STATUS_DB.PENDING,
        codeVersion: 1,
      });
      createdIds.push(service.id);
      this.broadcastService.broadcastServiceChange(
        data.projectId,
        SERVICE_CHANGE_EVENT_TYPES.SERVICE_CREATED,
        service.id
      );
    }

    // Update existing services
    for (const node of toUpdate) {
      if (!node.data) continue;
      const existing = existingServices.services.find(
        (s) => s.nodeId === node.id
      );
      if (existing) {
        const updateData: {
          serviceName?: string;
          blueprintId?: string;
          config?: Record<string, string>;
        } = {};
        if (node.data.serviceName) {
          updateData.serviceName = node.data.serviceName;
        }
        if (node.data.blueprintId) {
          updateData.blueprintId = node.data.blueprintId;
        }
        if (Object.keys(node.data.config || {}).length > 0) {
          updateData.config = node.data.config;
        }
        const updated = await this.serviceRepository.update(
          existing.id,
          updateData
        );
        if (updated) {
          updatedIds.push(updated.id);
          this.broadcastService.broadcastServiceChange(
            data.projectId,
            SERVICE_CHANGE_EVENT_TYPES.SERVICE_UPDATED,
            updated.id
          );
        }
      }
    }

    // Delete removed services
    for (const service of toDelete) {
      await this.serviceRepository.deleteByNodeId(
        data.projectId,
        service.nodeId
      );
      deletedIds.push(service.id);
      this.broadcastService.broadcastServiceChange(
        data.projectId,
        SERVICE_CHANGE_EVENT_TYPES.SERVICE_DELETED,
        service.id
      );
    }

    return createSuccessResponse({
      servicesCreated: createdIds.length,
      servicesUpdated: updatedIds.length,
      servicesDeleted: deletedIds.length,
      createdServiceIds: createdIds,
      updatedServiceIds: updatedIds,
      deletedServiceIds: deletedIds,
    });
  }
}
