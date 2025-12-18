import { Module } from "@nestjs/common";

import { GraphHttpController } from "@/graph/controllers/graph-http.controller";
import { GraphSseModule } from "@/graph/graph-sse.module";
import { GraphController } from "@/graph/graph.controller";
import { GraphService } from "@/graph/graph.service";
import { DatabaseNodeRepository } from "@/graph/repositories/database-node.repository";
import { GraphRepository } from "@/graph/repositories/graph.repository";
import { ProjectRepository } from "@/graph/repositories/project.repository";
import { ServiceRepository } from "@/graph/repositories/service.repository";
import { GraphOperationsService } from "@/graph/services/graph-operations.service";
import { GraphServicesService } from "@/graph/services/graph-services.service";
import { GraphSyncService } from "@/graph/services/graph-sync.service";
import { GraphValidationService } from "@/graph/services/graph-validation.service";
import { ProjectsService } from "@/graph/services/projects.service";

@Module({
  imports: [GraphSseModule],
  controllers: [GraphController, GraphHttpController],
  providers: [
    GraphService,
    ProjectsService,
    GraphOperationsService,
    GraphServicesService,
    GraphValidationService,
    GraphSyncService,
    ProjectRepository,
    GraphRepository,
    ServiceRepository,
    DatabaseNodeRepository,
  ],
})
export class GraphModule {}
