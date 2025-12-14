/**
 * Graph SSE Module
 * Server-Sent Events for real-time graph updates
 */

import { Module } from "@nestjs/common";

import { GraphSseController } from "@/graph/controllers/graph-sse.controller";
import { ProjectRepository } from "@/graph/repositories/project.repository";
import { GraphBroadcastService } from "@/graph/services/graph-broadcast.service";
import { GraphSseService } from "@/graph/services/graph-sse.service";

@Module({
  controllers: [GraphSseController],
  providers: [GraphSseService, GraphBroadcastService, ProjectRepository],
  exports: [GraphBroadcastService],
})
export class GraphSseModule {}
