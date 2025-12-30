import { SshModule } from "@axion/nestjs-common";
import { Module } from "@nestjs/common";

import { InfrastructureHttpController } from "@/infrastructure/controllers/infrastructure-http.controller";
import { InfrastructureDataModule } from "@/infrastructure/infrastructure-data.module";
import { InfrastructureController } from "@/infrastructure/infrastructure.controller";
import { InfrastructureService } from "@/infrastructure/infrastructure.service";
import { AgentInstallationService } from "@/infrastructure/services/agent-installation.service";
import { AgentStatusService } from "@/infrastructure/services/agent-status.service";
import { ClustersService } from "@/infrastructure/services/clusters.service";
import { ServerConfigurationService } from "@/infrastructure/services/server-configuration.service";
import { ServersService } from "@/infrastructure/services/servers.service";
import { SshKeyRotationService } from "@/infrastructure/services/ssh-key-rotation.service";

@Module({
  imports: [
    InfrastructureDataModule,
    // SSH Module (ServerRepository будет предоставлен через InfrastructureDataModule)
    SshModule.forRoot(),
  ],
  controllers: [InfrastructureController, InfrastructureHttpController],
  providers: [
    InfrastructureService,
    ClustersService,
    ServersService,
    AgentInstallationService,
    AgentStatusService,
    ServerConfigurationService,
    SshKeyRotationService,
  ],
})
export class InfrastructureModule {}
