import { Module } from "@nestjs/common";

import { GraphHttpController } from "@/graph/controllers/graph-http.controller";
import { GraphDataModule } from "@/graph/graph-data.module";
import { GraphSseModule } from "@/graph/graph-sse.module";
import { GraphController } from "@/graph/graph.controller";
import { GraphService } from "@/graph/graph.service";
import { GraphOperationsService } from "@/graph/services/graph-operations.service";
import { GraphServicesService } from "@/graph/services/graph-services.service";
import { GraphSyncService } from "@/graph/services/graph-sync.service";
import { GraphValidationService } from "@/graph/services/graph-validation.service";
import { ProjectsService } from "@/graph/services/projects.service";

@Module({
  imports: [GraphDataModule, GraphSseModule],
  controllers: [GraphController, GraphHttpController],
  providers: [
    GraphService,
    ProjectsService,
    GraphOperationsService,
    GraphServicesService,
    GraphValidationService,
    GraphSyncService,
  ],
})
export class GraphModule {}
