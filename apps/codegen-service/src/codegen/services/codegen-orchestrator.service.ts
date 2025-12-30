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
import { Injectable, Inject, forwardRef } from "@nestjs/common";

import { BlueprintsService } from "@/codegen/services/blueprints.service";
import { ContractDiscoveryService } from "@/codegen/services/contract-discovery.service";
import { GenerationService } from "@/codegen/services/generation.service";
import { ValidationService } from "@/codegen/services/validation.service";

/**
 * Main CodegenOrchestratorService - координатор, делегирует вызовы специализированным сервисам
 */
@Injectable()
export class CodegenOrchestratorService {
  constructor(
    @Inject(forwardRef(() => BlueprintsService))
    private readonly blueprintsService: BlueprintsService,
    @Inject(forwardRef(() => GenerationService))
    private readonly generationService: GenerationService,
    @Inject(forwardRef(() => ValidationService))
    private readonly validationService: ValidationService,
    @Inject(forwardRef(() => ContractDiscoveryService))
    private readonly contractDiscoveryService: ContractDiscoveryService
  ) {
    console.log("CodegenOrchestratorService initialized with:", {
      validationService: !!this.validationService,
    });
  }

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
