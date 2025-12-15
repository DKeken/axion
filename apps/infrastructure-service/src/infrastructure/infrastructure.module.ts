import { SshModule } from "@axion/nestjs-common";
import { Module } from "@nestjs/common";

import { InfrastructureController } from "@/infrastructure/infrastructure.controller";
import { InfrastructureService } from "@/infrastructure/infrastructure.service";
import { ClusterRepository } from "@/infrastructure/repositories/cluster.repository";
import { ServerRepository } from "@/infrastructure/repositories/server.repository";
import { AgentInstallationService } from "@/infrastructure/services/agent-installation.service";
import { AgentStatusService } from "@/infrastructure/services/agent-status.service";
import { ClustersService } from "@/infrastructure/services/clusters.service";
import { ServerConfigurationService } from "@/infrastructure/services/server-configuration.service";
import { ServersService } from "@/infrastructure/services/servers.service";
import { SshKeyRotationService } from "@/infrastructure/services/ssh-key-rotation.service";

@Module({
  imports: [
    // SSH Module (ServerRepository будет предоставлен через provider)
    SshModule.forRoot(),
  ],
  controllers: [InfrastructureController],
  providers: [
    InfrastructureService,
    ClustersService,
    ServersService,
    AgentInstallationService,
    AgentStatusService,
    ServerConfigurationService,
    SshKeyRotationService,
    ClusterRepository,
    ServerRepository,
    // Предоставляем ServerRepository для SSH processors через токен
    {
      provide: "SERVER_REPOSITORY",
      useExisting: ServerRepository,
    },
  ],
  exports: [ServerRepository],
})
export class InfrastructureModule {}
