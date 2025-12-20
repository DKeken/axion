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
import {
  AxionRequestMetadata,
  HttpAuthGuard,
  normalizePagination,
  toNumberOrUndefined,
  type PaginationQuery,
} from "@axion/nestjs-common";
import { TypedBody, TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, UseGuards } from "@nestjs/common";
import typia from "typia";

import { CodegenService } from "@/codegen/codegen.service";

@Controller("api")
@UseGuards(HttpAuthGuard)
export class CodegenHttpController {
  constructor(private readonly codegenService: CodegenService) {}

  // Generation / Validation (MVP)
  @TypedRoute.Post("projects/:projectId/generate")
  async generateProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string,
    @TypedBody() body: Omit<GenerateProjectRequest, "metadata" | "projectId">
  ) {
    const req: GenerateProjectRequest = { metadata, projectId, ...body };
    return this.codegenService.generateProject(
      typia.assert<GenerateProjectRequest>(req)
    );
  }

  @TypedRoute.Post("projects/:projectId/services/:nodeId/generate")
  async generateService(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string,
    @TypedParam("nodeId") nodeId: string,
    @TypedBody()
    body: Omit<GenerateServiceRequest, "metadata" | "projectId" | "nodeId">
  ) {
    const req: GenerateServiceRequest = {
      metadata,
      projectId,
      nodeId,
      ...body,
    };
    return this.codegenService.generateService(
      typia.assert<GenerateServiceRequest>(req)
    );
  }

  @TypedRoute.Post("projects/:projectId/validate")
  async validateProject(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string,
    @TypedBody() body: Omit<ValidateProjectRequest, "metadata" | "projectId">
  ) {
    const req: ValidateProjectRequest = { metadata, projectId, ...body };
    return this.codegenService.validateProject(
      typia.assert<ValidateProjectRequest>(req)
    );
  }

  @TypedRoute.Post("projects/:projectId/services/:nodeId/validate")
  async validateService(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("projectId") projectId: string,
    @TypedParam("nodeId") nodeId: string,
    @TypedBody()
    body: Omit<ValidateServiceRequest, "metadata" | "projectId" | "nodeId">
  ) {
    const req: ValidateServiceRequest = {
      metadata,
      projectId,
      nodeId,
      ...body,
    };
    return this.codegenService.validateService(
      typia.assert<ValidateServiceRequest>(req)
    );
  }

  // Blueprints
  @TypedRoute.Get("blueprints")
  async listBlueprints(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedQuery() query?: { category?: string } & PaginationQuery
  ) {
    const categoryNumber = toNumberOrUndefined(query?.category);
    const req: ListBlueprintsRequest = {
      metadata,
      ...(categoryNumber !== undefined
        ? {
            // BlueprintCategory is a Protobuf enum; for HTTP accept numeric value.
            // (Clients can import enum values from @axion/contracts.)
            category: categoryNumber as ListBlueprintsRequest["category"],
          }
        : {}),
    };
    return this.codegenService.listBlueprints(
      typia.assert<ListBlueprintsRequest>({
        ...req,
        pagination: normalizePagination(query),
      })
    );
  }

  @TypedRoute.Get("blueprints/:blueprintId")
  async getBlueprint(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("blueprintId") blueprintId: string
  ) {
    const req: GetBlueprintRequest = { metadata, blueprintId };
    return this.codegenService.getBlueprint(
      typia.assert<GetBlueprintRequest>(req)
    );
  }

  // Contracts (useful for UI/CLI; optional for MVP but exposed for completeness)
  @TypedRoute.Post("contracts/discover")
  async discoverContracts(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedBody() body: Omit<DiscoverContractsRequest, "metadata">
  ) {
    const req: DiscoverContractsRequest = { metadata, ...body };
    return this.codegenService.discoverContracts(
      typia.assert<DiscoverContractsRequest>(req)
    );
  }

  @TypedRoute.Post("contracts/validate")
  async validateContracts(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedBody() body: Omit<ValidateContractsRequest, "metadata">
  ) {
    const req: ValidateContractsRequest = { metadata, ...body };
    return this.codegenService.validateContracts(
      typia.assert<ValidateContractsRequest>(req)
    );
  }
}
