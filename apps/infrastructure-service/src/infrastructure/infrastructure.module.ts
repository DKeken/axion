import { Module } from "@nestjs/common";

import { InfrastructureController } from "@/infrastructure/infrastructure.controller";
import { InfrastructureService } from "@/infrastructure/infrastructure.service";
import { ClusterRepository } from "@/infrastructure/repositories/cluster.repository";
import { ServerRepository } from "@/infrastructure/repositories/server.repository";
import { ClustersService } from "@/infrastructure/services/clusters.service";
import { ServersService } from "@/infrastructure/services/servers.service";

@Module({
  controllers: [InfrastructureController],
  providers: [
    InfrastructureService,
    ClustersService,
    ServersService,
    ClusterRepository,
    ServerRepository,
  ],
})
export class InfrastructureModule {}
