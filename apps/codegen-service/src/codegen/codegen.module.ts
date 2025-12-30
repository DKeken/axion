import { Module } from "@nestjs/common";

import { CodegenController } from "@/codegen/codegen.controller";
import { CodegenHttpController } from "@/codegen/controllers/codegen-http.controller";
import { BlueprintRepository } from "@/codegen/repositories/blueprint.repository";
import { GenerationHistoryRepository } from "@/codegen/repositories/generation-history.repository";
import { ValidationResultRepository } from "@/codegen/repositories/validation-result.repository";
import { BlueprintsService } from "@/codegen/services/blueprints.service";
import { CodegenOrchestratorService } from "@/codegen/services/codegen-orchestrator.service";
import { ContractDiscoveryService } from "@/codegen/services/contract-discovery.service";
import { DatabaseNodeCodeGeneratorService } from "@/codegen/services/database-node-code-generator.service";
import { DatabaseFactoryService } from "@/codegen/services/factories/database-factory.service";
import { MessagingFactoryService } from "@/codegen/services/factories/messaging-factory.service";
import { ServiceFactoryService } from "@/codegen/services/factories/service-factory.service";
import { GenerationService } from "@/codegen/services/generation.service";
import { OpenRouterService } from "@/codegen/services/openrouter.service";
import { PromptBuilderService } from "@/codegen/services/prompt-builder.service";
import { ProtobufContractGeneratorService } from "@/codegen/services/protobuf-contract-generator.service";
import { SchemaGeneratorService } from "@/codegen/services/schema-generator.service";
import { TemplateEngineService } from "@/codegen/services/template-engine.service";
import { ValidationService } from "@/codegen/services/validation.service";
import { BuildValidatorService } from "@/codegen/services/validators/build-validator.service";
import { ContractDiscoveryValidatorService } from "@/codegen/services/validators/contract-discovery-validator.service";
import { ContractValidatorService } from "@/codegen/services/validators/contract-validator.service";
import { HealthCheckValidatorService } from "@/codegen/services/validators/health-check-validator.service";
import { StructuralValidatorService } from "@/codegen/services/validators/structural-validator.service";
import { TypeScriptValidatorService } from "@/codegen/services/validators/typescript-validator.service";

@Module({
  controllers: [CodegenController, CodegenHttpController],
  providers: [
    CodegenOrchestratorService,
    BlueprintsService,
    GenerationService,
    ValidationService,
    ContractDiscoveryService,
    OpenRouterService,
    PromptBuilderService,
    TemplateEngineService,
    SchemaGeneratorService,
    DatabaseNodeCodeGeneratorService,
    DatabaseFactoryService,
    MessagingFactoryService,
    ServiceFactoryService,
    ProtobufContractGeneratorService,
    StructuralValidatorService,
    ContractValidatorService,
    TypeScriptValidatorService,
    BuildValidatorService,
    HealthCheckValidatorService,
    ContractDiscoveryValidatorService,
    BlueprintRepository,
    GenerationHistoryRepository,
    ValidationResultRepository,
  ],
})
export class CodegenModule {}
