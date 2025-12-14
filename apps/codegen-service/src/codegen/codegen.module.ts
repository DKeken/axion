import { Module } from "@nestjs/common";

import { CodegenController } from "@/codegen/codegen.controller";
import { CodegenService } from "@/codegen/codegen.service";
import { BlueprintRepository } from "@/codegen/repositories/blueprint.repository";
import { GenerationHistoryRepository } from "@/codegen/repositories/generation-history.repository";
import { ValidationResultRepository } from "@/codegen/repositories/validation-result.repository";
import { BlueprintsService } from "@/codegen/services/blueprints.service";
import { ContractDiscoveryService } from "@/codegen/services/contract-discovery.service";
import { DatabaseNodeCodeGeneratorService } from "@/codegen/services/database-node-code-generator.service";
import { DatabaseFactoryService } from "@/codegen/services/factories/database-factory.service";
import { MessagingFactoryService } from "@/codegen/services/factories/messaging-factory.service";
import { ServiceFactoryService } from "@/codegen/services/factories/service-factory.service";
import { GenerationService } from "@/codegen/services/generation.service";
import { OpenRouterService } from "@/codegen/services/openrouter.service";
import { PromptBuilderService } from "@/codegen/services/prompt-builder.service";
import { ProtobufContractGeneratorService } from "@/codegen/services/protobuf-contract-generator.service";
import { TemplateEngineService } from "@/codegen/services/template-engine.service";
import { ValidationService } from "@/codegen/services/validation.service";

@Module({
  controllers: [CodegenController],
  providers: [
    // Main coordinator
    CodegenService,
    // Specialized services
    BlueprintsService,
    GenerationService,
    ValidationService,
    ContractDiscoveryService,
    // AI services
    OpenRouterService,
    PromptBuilderService,
    // Template engine
    TemplateEngineService,
    // Database node code generator
    DatabaseNodeCodeGeneratorService,
    // Factory patterns
    DatabaseFactoryService,
    MessagingFactoryService,
    ServiceFactoryService,
    // Protobuf contract generator
    ProtobufContractGeneratorService,
    // Repositories
    BlueprintRepository,
    GenerationHistoryRepository,
    ValidationResultRepository,
  ],
})
export class CodegenModule {}
