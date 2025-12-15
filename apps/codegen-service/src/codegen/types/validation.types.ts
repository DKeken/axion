/**
 * Types for Validation System
 */

/**
 * Validation level
 */
export type ValidationLevel =
  | "structural"
  | "contract"
  | "typescript"
  | "build"
  | "healthCheck"
  | "contractDiscovery";

/**
 * Structural validation result
 */
export type StructuralValidationResult = {
  valid: boolean;
  errors: Array<{ file: string; message: string }>;
  missingFiles: string[];
};

/**
 * Contract validation result
 */
export type ContractValidationResult = {
  valid: boolean;
  errors: Array<{ pattern: string; message: string; file?: string }>;
  missingContracts: string[];
  unusedContracts: string[];
};

/**
 * TypeScript validation result
 */
export type TypeScriptValidationResult = {
  valid: boolean;
  errors: Array<{
    file: string;
    line?: number;
    column?: number;
    message: string;
  }>;
  output: string;
};

/**
 * Build validation result
 */
export type BuildValidationResult = {
  valid: boolean;
  errors: Array<{ message: string; file?: string }>;
  output: string;
};

/**
 * Health check validation result
 */
export type HealthCheckValidationResult = {
  valid: boolean;
  errors: Array<{ endpoint: string; message: string }>;
  healthCheckPassed: boolean;
  messagePatternsPassed: boolean;
};

/**
 * Contract discovery validation result
 */
export type ContractDiscoveryValidationResult = {
  valid: boolean;
  errors: Array<{ pattern: string; message: string }>;
  discoveredContracts: number;
};
