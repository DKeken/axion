/**
 * Graph Broadcast Service
 * Broadcasts graph updates via Server-Sent Events (SSE)
 */

import type { GraphData } from "@axion/contracts";
import { Injectable, Inject } from "@nestjs/common";

import { GraphSseService } from "@/graph/services/graph-sse.service";
import type {
  ProjectEvent,
  ServiceChangeEventType,
} from "@/graph/types/sse-events";
import { SSE_EVENT_TYPES } from "@/graph/types/sse-events";

@Injectable()
export class GraphBroadcastService {
  constructor(
    @Inject(GraphSseService)
    private readonly sseService: GraphSseService
  ) {}

  /**
   * Broadcast graph update to project subscribers via SSE
   */
  broadcastGraphUpdate(projectId: string, graphData: GraphData): void {
    const event: ProjectEvent = {
      type: SSE_EVENT_TYPES.GRAPH_UPDATED,
      projectId,
      data: {
        graphData,
      },
      timestamp: Date.now(),
    };
    this.sseService.broadcast(projectId, event);
  }

  /**
   * Broadcast service change to project subscribers via SSE
   */
  broadcastServiceChange(
    projectId: string,
    eventType: ServiceChangeEventType,
    serviceId: string
  ): void {
    const event: ProjectEvent = {
      type: SSE_EVENT_TYPES.SERVICE_CHANGED,
      projectId,
      data: {
        event: eventType,
        serviceId,
      },
      timestamp: Date.now(),
    };
    this.sseService.broadcast(projectId, event);
  }
}
