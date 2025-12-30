/**
 * Graph SSE Module
 * Server-Sent Events for real-time graph updates
 */

import { Module } from "@nestjs/common";

import { GraphSseController } from "@/graph/controllers/graph-sse.controller";
import { GraphDataModule } from "@/graph/graph-data.module";
import { GraphBroadcastService } from "@/graph/services/graph-broadcast.service";
import { GraphSseService } from "@/graph/services/graph-sse.service";

@Module({
  imports: [GraphDataModule],
  controllers: [GraphSseController],
  providers: [GraphSseService, GraphBroadcastService],
  exports: [GraphBroadcastService],
})
export class GraphSseModule {}
