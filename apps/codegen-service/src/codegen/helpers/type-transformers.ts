/**
 * Type transformers for converting DB types to contract types
 */

import {
  BlueprintCategory,
  BlueprintInfrastructure,
  DatabaseType,
  CacheType,
  QueueType,
  ValidationStatus,
  type Blueprint,
  type BlueprintStructure,
  type BlueprintContracts,
} from "@axion/contracts";

import type { Blueprint as DbBlueprint } from "@/database/schema";

/**
 * Transform DB blueprint category string to BlueprintCategory enum
 */
function transformCategory(category: string): BlueprintCategory {
  const categoryMap: Record<string, BlueprintCategory> = {
    unspecified: BlueprintCategory.BLUEPRINT_CATEGORY_UNSPECIFIED,
    crud: BlueprintCategory.BLUEPRINT_CATEGORY_CRUD,
    auth: BlueprintCategory.BLUEPRINT_CATEGORY_AUTH,
    payment: BlueprintCategory.BLUEPRINT_CATEGORY_PAYMENT,
    notification: BlueprintCategory.BLUEPRINT_CATEGORY_NOTIFICATION,
    analytics: BlueprintCategory.BLUEPRINT_CATEGORY_ANALYTICS,
    custom: BlueprintCategory.BLUEPRINT_CATEGORY_CUSTOM,
  };

  return categoryMap[category] || BlueprintCategory.BLUEPRINT_CATEGORY_CUSTOM;
}

/**
 * Transform DB infrastructure to contract format
 */
function transformInfrastructure(
  infrastructure: DbBlueprint["infrastructure"]
): BlueprintInfrastructure | undefined {
  if (!infrastructure) {
    return undefined;
  }

  return {
    database: infrastructure.database
      ? {
          type:
            DatabaseType[
              `DATABASE_TYPE_${infrastructure.database.type.toUpperCase()}` as keyof typeof DatabaseType
            ] || DatabaseType.DATABASE_TYPE_UNSPECIFIED,
          schemaTemplate: infrastructure.database.schemaTemplate || "",
          uiForm:
            (infrastructure.database.uiForm as Record<string, string>) || {},
        }
      : undefined,
    cache: infrastructure.cache
      ? {
          type:
            CacheType[
              `CACHE_TYPE_${infrastructure.cache.type.toUpperCase()}` as keyof typeof CacheType
            ] || CacheType.CACHE_TYPE_UNSPECIFIED,
          enabled: infrastructure.cache.enabled,
        }
      : undefined,
    queue: infrastructure.queue
      ? {
          type:
            QueueType[
              `QUEUE_TYPE_${infrastructure.queue.type.toUpperCase()}` as keyof typeof QueueType
            ] || QueueType.QUEUE_TYPE_UNSPECIFIED,
          enabled: infrastructure.queue.enabled,
        }
      : undefined,
  };
}

/**
 * Transform DB blueprint structure to contract format
 */
function transformStructure(
  structure: DbBlueprint["structure"]
): BlueprintStructure {
  if (!structure) {
    return {
      requiredFiles: [],
      templates: {},
      llmGenerationPoints: [],
    };
  }

  return {
    requiredFiles: structure.requiredFiles || [],
    templates: structure.templates || {},
    llmGenerationPoints: structure.llmGenerationPoints || [],
  };
}

/**
 * Transform DB blueprint contracts to contract format
 */
function transformContracts(
  contracts: DbBlueprint["contracts"]
): BlueprintContracts {
  if (!contracts) {
    return {
      autoGenerate: false,
      basePattern: "",
      defaultActions: [],
    };
  }

  return {
    autoGenerate: contracts.autoGenerate ?? false,
    basePattern: contracts.basePattern || "",
    defaultActions: contracts.defaultActions || [],
  };
}

/**
 * Transform database blueprint to contract format
 */
export function transformBlueprintToContract(bp: DbBlueprint): Blueprint {
  return {
    id: bp.id,
    name: bp.name,
    category: transformCategory(bp.category),
    description: bp.description || "",
    version: bp.version,
    structure: transformStructure(bp.structure),
    infrastructure: transformInfrastructure(bp.infrastructure),
    contracts: transformContracts(bp.contracts),
    llmInstructions: bp.llmInstructions || "",
  };
}

/**
 * Transform DB validation status string to ValidationStatus enum
 */
export function transformValidationStatus(status: string): ValidationStatus {
  const statusMap: Record<string, ValidationStatus> = {
    unspecified: ValidationStatus.VALIDATION_STATUS_UNSPECIFIED,
    pending: ValidationStatus.VALIDATION_STATUS_PENDING,
    validated: ValidationStatus.VALIDATION_STATUS_VALIDATED,
    error: ValidationStatus.VALIDATION_STATUS_ERROR,
  };

  return statusMap[status] || ValidationStatus.VALIDATION_STATUS_UNSPECIFIED;
}
