import { Module, Global } from "@nestjs/common";

import { DatabaseNodeRepository } from "@/graph/repositories/database-node.repository";
import { GraphRepository } from "@/graph/repositories/graph.repository";
import { ProjectRepository } from "@/graph/repositories/project.repository";
import { ServiceRepository } from "@/graph/repositories/service.repository";

@Global()
@Module({
  providers: [
    ProjectRepository,
    GraphRepository,
    ServiceRepository,
    DatabaseNodeRepository,
  ],
  exports: [
    ProjectRepository,
    GraphRepository,
    ServiceRepository,
    DatabaseNodeRepository,
  ],
})
export class GraphDataModule {}

