import { Module } from "@nestjs/common";
import { SshModule } from "@axion/nestjs-common";
import { InfrastructureController } from "./infrastructure.controller";
import { InfrastructureKafkaController } from "./infrastructure-kafka.controller";
import { InfrastructureService } from "./infrastructure.service";
import { ServerRepository } from "./repositories/server.repository";
import { AgentRepository } from "./repositories/agent.repository";
import { ClusterRepository } from "./repositories/cluster.repository";

/**
 * Infrastructure Module
 * Manages servers, agents, and infrastructure resources
 * Provides both Connect-RPC and Kafka transports
 */
@Module({
  imports: [
    SshModule.forRoot(), // No repo passed, we'll handle credentials manually
  ],
  controllers: [InfrastructureController, InfrastructureKafkaController],
  providers: [
    InfrastructureService,
    ServerRepository,
    AgentRepository,
    ClusterRepository,
  ],
  exports: [InfrastructureService],
})
export class InfrastructureModule {}
