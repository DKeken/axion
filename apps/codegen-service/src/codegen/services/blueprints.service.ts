import {
  type Blueprint,
  type GetBlueprintRequest,
  type ListBlueprintsRequest,
} from "@axion/contracts";
import {
  createErrorResponse,
  createNotFoundError,
  createSuccessResponse,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { transformBlueprintToContract } from "@/codegen/helpers/type-transformers";
import { type BlueprintRepository } from "@/codegen/repositories/blueprint.repository";
import type { Blueprint as DbBlueprint } from "@/database/schema";

@Injectable()
export class BlueprintsService extends BaseService {
  constructor(private readonly blueprintRepository: BlueprintRepository) {
    super(BlueprintsService.name);
  }

  @CatchError({ operation: "listing blueprints" })
  async list(data: ListBlueprintsRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    let dbBlueprints: DbBlueprint[];
    if (data.category) {
      dbBlueprints = await this.blueprintRepository.findByCategory(
        data.category.toString()
      );
    } else {
      dbBlueprints = await this.blueprintRepository.findAllBlueprints();
    }

    // Transform to contract format
    const blueprintsData: Blueprint[] = dbBlueprints.map((bp) =>
      transformBlueprintToContract(bp)
    );

    return createSuccessResponse({
      blueprints: blueprintsData,
    });
  }

  @CatchError({ operation: "getting blueprint" })
  async get(data: GetBlueprintRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    const dbBlueprint = await this.blueprintRepository.findById(
      data.blueprintId
    );
    if (!dbBlueprint) {
      return createErrorResponse(
        createNotFoundError("Blueprint", data.blueprintId)
      );
    }

    // Transform to contract format
    const blueprintData: Blueprint = transformBlueprintToContract(dbBlueprint);

    return createSuccessResponse(blueprintData);
  }
}
