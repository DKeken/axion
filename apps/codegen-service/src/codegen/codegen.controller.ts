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
  async generateProject(@Payload() data: GenerateProjectRequest) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.GENERATE_SERVICE)
  @DelegateToService("codegenService", "generateService")
  async generateService(@Payload() data: GenerateServiceRequest) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.VALIDATE_PROJECT)
  @DelegateToService("codegenService", "validateProject")
  async validateProject(@Payload() data: ValidateProjectRequest) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.VALIDATE_SERVICE)
  @DelegateToService("codegenService", "validateService")
  async validateService(@Payload() data: ValidateServiceRequest) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.LIST_BLUEPRINTS)
  @DelegateToService("codegenService", "listBlueprints")
  async listBlueprints(@Payload() data: ListBlueprintsRequest) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.GET_BLUEPRINT)
  @DelegateToService("codegenService", "getBlueprint")
  async getBlueprint(@Payload() data: GetBlueprintRequest) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.DISCOVER_CONTRACTS)
  @DelegateToService("codegenService", "discoverContracts")
  async discoverContracts(@Payload() data: DiscoverContractsRequest) {
    return data;
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.VALIDATE_CONTRACTS)
  @DelegateToService("codegenService", "validateContracts")
  async validateContracts(@Payload() data: ValidateContractsRequest) {
    return data;
  }
}
