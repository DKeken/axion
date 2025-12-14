import {
  type DiscoverContractsRequest,
  type GenerateProjectRequest,
  type GenerateServiceRequest,
  type GetBlueprintRequest,
  type ListBlueprintsRequest,
  type ValidateContractsRequest,
  type ValidateProjectRequest,
  type ValidateServiceRequest,
} from "@axion/contracts";
import { Injectable } from "@nestjs/common";

import { BlueprintsService } from "@/codegen/services/blueprints.service";
import { ContractDiscoveryService } from "@/codegen/services/contract-discovery.service";
import { GenerationService } from "@/codegen/services/generation.service";
import { ValidationService } from "@/codegen/services/validation.service";

/**
 * Main CodegenService - координатор, делегирует вызовы специализированным сервисам
 */
@Injectable()
export class CodegenService {
  constructor(
    private readonly blueprintsService: BlueprintsService,
    private readonly generationService: GenerationService,
    private readonly validationService: ValidationService,
    private readonly contractDiscoveryService: ContractDiscoveryService
  ) {}

  // Generation
  async generateProject(data: GenerateProjectRequest) {
    return this.generationService.generateProject(data);
  }

  async generateService(data: GenerateServiceRequest) {
    return this.generationService.generateService(data);
  }

  // Validation
  async validateProject(data: ValidateProjectRequest) {
    return this.validationService.validateProject(data);
  }

  async validateService(data: ValidateServiceRequest) {
    return this.validationService.validateService(data);
  }

  // Blueprints
  async listBlueprints(data: ListBlueprintsRequest) {
    return this.blueprintsService.list(data);
  }

  async getBlueprint(data: GetBlueprintRequest) {
    return this.blueprintsService.get(data);
  }

  // Contract Discovery
  async discoverContracts(data: DiscoverContractsRequest) {
    return this.contractDiscoveryService.discover(data);
  }

  async validateContracts(data: ValidateContractsRequest) {
    return this.contractDiscoveryService.validate(data);
  }
}
