import type {
  DiscoverContractsRequest,
  GenerateProjectRequest,
  GenerateServiceRequest,
  GetBlueprintRequest,
  ListBlueprintsRequest,
  RequestMetadata,
  ValidateContractsRequest,
  ValidateProjectRequest,
  ValidateServiceRequest,
} from "@axion/contracts";
import { AxionRequestMetadata, HttpAuthGuard } from "@axion/nestjs-common";
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CodegenService } from "@/codegen/codegen.service";

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

@Controller("api")
@UseGuards(HttpAuthGuard)
export class CodegenHttpController {
  constructor(private readonly codegenService: CodegenService) {}

  // Generation / Validation (MVP)
  @Post("projects/:projectId/generate")
  async generateProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string,
    @Body() body: Omit<GenerateProjectRequest, "metadata" | "projectId">
  ) {
    const req: GenerateProjectRequest = { metadata, projectId, ...body };
    return this.codegenService.generateProject(req);
  }

  @Post("projects/:projectId/services/:nodeId/generate")
  async generateService(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string,
    @Param("nodeId") nodeId: string,
    @Body()
    body: Omit<GenerateServiceRequest, "metadata" | "projectId" | "nodeId">
  ) {
    const req: GenerateServiceRequest = {
      metadata,
      projectId,
      nodeId,
      ...body,
    };
    return this.codegenService.generateService(req);
  }

  @Post("projects/:projectId/validate")
  async validateProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string,
    @Body() body: Omit<ValidateProjectRequest, "metadata" | "projectId">
  ) {
    const req: ValidateProjectRequest = { metadata, projectId, ...body };
    return this.codegenService.validateProject(req);
  }

  @Post("projects/:projectId/services/:nodeId/validate")
  async validateService(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("projectId") projectId: string,
    @Param("nodeId") nodeId: string,
    @Body()
    body: Omit<ValidateServiceRequest, "metadata" | "projectId" | "nodeId">
  ) {
    const req: ValidateServiceRequest = {
      metadata,
      projectId,
      nodeId,
      ...body,
    };
    return this.codegenService.validateService(req);
  }

  // Blueprints
  @Get("blueprints")
  async listBlueprints(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Query("category") category?: string
  ) {
    const req: ListBlueprintsRequest = {
      metadata,
      ...(category
        ? {
            // BlueprintCategory is a Protobuf enum; for HTTP accept numeric value.
            // (Clients can import enum values from @axion/contracts.)
            category: parsePositiveInt(
              category,
              0
            ) as unknown as ListBlueprintsRequest["category"],
          }
        : {}),
    };
    return this.codegenService.listBlueprints(req);
  }

  @Get("blueprints/:blueprintId")
  async getBlueprint(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("blueprintId") blueprintId: string
  ) {
    const req: GetBlueprintRequest = { metadata, blueprintId };
    return this.codegenService.getBlueprint(req);
  }

  // Contracts (useful for UI/CLI; optional for MVP but exposed for completeness)
  @Post("contracts/discover")
  async discoverContracts(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Body() body: Omit<DiscoverContractsRequest, "metadata">
  ) {
    const req: DiscoverContractsRequest = { metadata, ...body };
    return this.codegenService.discoverContracts(req);
  }

  @Post("contracts/validate")
  async validateContracts(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Body() body: Omit<ValidateContractsRequest, "metadata">
  ) {
    const req: ValidateContractsRequest = { metadata, ...body };
    return this.codegenService.validateContracts(req);
  }
}
