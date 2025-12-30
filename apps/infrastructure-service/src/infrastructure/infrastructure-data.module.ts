import { Module, Global } from "@nestjs/common";

import { ClusterRepository } from "@/infrastructure/repositories/cluster.repository";
import { ServerRepository } from "@/infrastructure/repositories/server.repository";

@Global()
@Module({
  providers: [
    ClusterRepository,
    ServerRepository,
    {
      provide: "SERVER_REPOSITORY",
      useExisting: ServerRepository,
    },
  ],
  exports: [ClusterRepository, ServerRepository, "SERVER_REPOSITORY"],
})
export class InfrastructureDataModule {}
