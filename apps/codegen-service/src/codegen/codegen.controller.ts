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
  MessagePatternWithLog,
  MicroserviceAuthGuard,
} from "@axion/nestjs-common";
import { Controller, UseGuards } from "@nestjs/common";
import { Payload } from "@nestjs/microservices";

import { CodegenService } from "@/codegen/codegen.service";

@Controller()
@UseGuards(MicroserviceAuthGuard)
export class CodegenController {
  constructor(private readonly codegenService: CodegenService) {}

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.GENERATE_PROJECT)
  async generateProject(@Payload() data: GenerateProjectRequest) {
    return this.codegenService.generateProject(data);
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.GENERATE_SERVICE)
  async generateService(@Payload() data: GenerateServiceRequest) {
    return this.codegenService.generateService(data);
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.VALIDATE_PROJECT)
  async validateProject(@Payload() data: ValidateProjectRequest) {
    return this.codegenService.validateProject(data);
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.VALIDATE_SERVICE)
  async validateService(@Payload() data: ValidateServiceRequest) {
    return this.codegenService.validateService(data);
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.LIST_BLUEPRINTS)
  async listBlueprints(@Payload() data: ListBlueprintsRequest) {
    return this.codegenService.listBlueprints(data);
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.GET_BLUEPRINT)
  async getBlueprint(@Payload() data: GetBlueprintRequest) {
    return this.codegenService.getBlueprint(data);
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.DISCOVER_CONTRACTS)
  async discoverContracts(@Payload() data: DiscoverContractsRequest) {
    return this.codegenService.discoverContracts(data);
  }

  @MessagePatternWithLog(CODEGEN_SERVICE_PATTERNS.VALIDATE_CONTRACTS)
  async validateContracts(@Payload() data: ValidateContractsRequest) {
    return this.codegenService.validateContracts(data);
  }
}
