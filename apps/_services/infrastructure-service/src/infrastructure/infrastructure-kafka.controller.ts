import { Controller, Logger, UseInterceptors } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ProtoValidationInterceptor } from "@axion/nestjs-common";
import {
  type RegisterServerRequest,
  type RegisterServerResponse,
  type GetServerRequest,
  type GetServerResponse,
  type ListServersRequest,
  type ListServersResponse,
  type UpdateServerStatusRequest,
  type UpdateServerStatusResponse,
  type DeleteServerRequest,
  type DeleteServerResponse,
  RegisterServerRequestSchema,
  RegisterServerResponseSchema,
  GetServerRequestSchema,
  GetServerResponseSchema,
  ListServersRequestSchema,
  ListServersResponseSchema,
  UpdateServerStatusRequestSchema,
  UpdateServerStatusResponseSchema,
  DeleteServerRequestSchema,
  DeleteServerResponseSchema,
} from "@axion/contracts";
import { INFRASTRUCTURE_SERVICE_PATTERNS } from "@/constants/patterns";
import { InfrastructureService } from "./infrastructure.service";

/**
 * Infrastructure Kafka Controller
 * Handles Kafka messages for infrastructure management
 * This provides Kafka transport in addition to Connect-RPC
 */
@Controller()
export class InfrastructureKafkaController {
  private readonly logger = new Logger(InfrastructureKafkaController.name);

  constructor(private readonly infrastructureService: InfrastructureService) {}

  @MessagePattern(INFRASTRUCTURE_SERVICE_PATTERNS.REGISTER_SERVER)
  @UseInterceptors(
    new ProtoValidationInterceptor(
      RegisterServerRequestSchema,
      RegisterServerResponseSchema
    )
  )
  async registerServer(
    @Payload() data: RegisterServerRequest
  ): Promise<RegisterServerResponse> {
    this.logger.log("Kafka: RegisterServer called");
    return this.infrastructureService.registerServer(data);
  }

  @MessagePattern(INFRASTRUCTURE_SERVICE_PATTERNS.GET_SERVER)
  @UseInterceptors(
    new ProtoValidationInterceptor(
      GetServerRequestSchema,
      GetServerResponseSchema
    )
  )
  async getServer(
    @Payload() data: GetServerRequest
  ): Promise<GetServerResponse> {
    this.logger.log(`Kafka: GetServer called: ${data.serverId}`);
    return this.infrastructureService.getServer(data);
  }

  @MessagePattern(INFRASTRUCTURE_SERVICE_PATTERNS.LIST_SERVERS)
  @UseInterceptors(
    new ProtoValidationInterceptor(
      ListServersRequestSchema,
      ListServersResponseSchema
    )
  )
  async listServers(
    @Payload() data: ListServersRequest
  ): Promise<ListServersResponse> {
    this.logger.log("Kafka: ListServers called");
    return this.infrastructureService.listServers(data);
  }

  @MessagePattern(INFRASTRUCTURE_SERVICE_PATTERNS.UPDATE_SERVER_STATUS)
  @UseInterceptors(
    new ProtoValidationInterceptor(
      UpdateServerStatusRequestSchema,
      UpdateServerStatusResponseSchema
    )
  )
  async updateServerStatus(
    @Payload() data: UpdateServerStatusRequest
  ): Promise<UpdateServerStatusResponse> {
    this.logger.log(`Kafka: UpdateServerStatus called: ${data.serverId}`);
    return this.infrastructureService.updateServerStatus(data);
  }

  @MessagePattern(INFRASTRUCTURE_SERVICE_PATTERNS.DELETE_SERVER)
  @UseInterceptors(
    new ProtoValidationInterceptor(
      DeleteServerRequestSchema,
      DeleteServerResponseSchema
    )
  )
  async deleteServer(
    @Payload() data: DeleteServerRequest
  ): Promise<DeleteServerResponse> {
    this.logger.log(`Kafka: DeleteServer called: ${data.serverId}`);
    return this.infrastructureService.deleteServer(data);
  }
}
