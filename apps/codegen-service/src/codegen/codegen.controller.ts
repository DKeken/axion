import {
  CODEGEN_SERVICE_PATTERNS,
  type DiscoverContractsRequest,
  type GenerateProjectRequest,
  type GenerateServiceRequest,
  type GetBlueprintRequest,
  type ListBlueprintsRequest,
  type ValidateContractsRequest,
  type ValidateProjectRequest,
  type ValidateServiceRequest,
} from "@axion/contracts";
import {
  DelegateToService,
  MessagePatternWithLog,
  MicroserviceAuthGuard,
  createTypiaAssertPipe,
} from "@axion/nestjs-common";
import { Controller, UseGuards } from "@nestjs/common";
import { Payload } from "@nestjs/microservices";

import { CodegenService } from "@/codegen/codegen.service";

@Controller()
@UseGuards(MicroserviceAuthGuard)
export class CodegenController {
  constructor(private readonly codegenService: CodegenService) {
    void this.codegenService;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.GENERATE_PROJECT)
  @DelegateToService("codegenService", "generateProject")
  async generateProject(
    @Payload(createTypiaAssertPipe<GenerateProjectRequest>())
    data: GenerateProjectRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.GENERATE_SERVICE)
  @DelegateToService("codegenService", "generateService")
  async generateService(
    @Payload(createTypiaAssertPipe<GenerateServiceRequest>())
    data: GenerateServiceRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.VALIDATE_PROJECT)
  @DelegateToService("codegenService", "validateProject")
  async validateProject(
    @Payload(createTypiaAssertPipe<ValidateProjectRequest>())
    data: ValidateProjectRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.VALIDATE_SERVICE)
  @DelegateToService("codegenService", "validateService")
  async validateService(
    @Payload(createTypiaAssertPipe<ValidateServiceRequest>())
    data: ValidateServiceRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.LIST_BLUEPRINTS)
  @DelegateToService("codegenService", "listBlueprints")
  async listBlueprints(
    @Payload(createTypiaAssertPipe<ListBlueprintsRequest>())
    data: ListBlueprintsRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.GET_BLUEPRINT)
  @DelegateToService("codegenService", "getBlueprint")
  async getBlueprint(
    @Payload(createTypiaAssertPipe<GetBlueprintRequest>())
    data: GetBlueprintRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.DISCOVER_CONTRACTS)
  @DelegateToService("codegenService", "discoverContracts")
  async discoverContracts(
    @Payload(createTypiaAssertPipe<DiscoverContractsRequest>())
    data: DiscoverContractsRequest
  ) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.VALIDATE_CONTRACTS)
  @DelegateToService("codegenService", "validateContracts")
  async validateContracts(
    @Payload(createTypiaAssertPipe<ValidateContractsRequest>())
    data: ValidateContractsRequest
  ) {
    return data;
  }
}
