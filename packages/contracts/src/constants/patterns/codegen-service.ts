/**
 * Codegen Service message pattern constants
 * Format: {service-name}.{action}
 */

export const CODEGEN_SERVICE_PATTERNS = {
  GENERATE_PROJECT: "codegen-service.generateProject",
  GENERATE_SERVICE: "codegen-service.generateService",
  VALIDATE_PROJECT: "codegen-service.validateProject",
  VALIDATE_SERVICE: "codegen-service.validateService",
  LIST_BLUEPRINTS: "codegen-service.listBlueprints",
  GET_BLUEPRINT: "codegen-service.getBlueprint",
  DISCOVER_CONTRACTS: "codegen-service.discoverContracts",
  VALIDATE_CONTRACTS: "codegen-service.validateContracts",
} as const;
