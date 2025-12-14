/**
 * Types for contract validation and discovery
 */

import type { ContractErrorType } from "../../generated/common/common";

export type { ContractErrorType };

export interface DiscoveredContract {
  serviceName: string;
  messagePattern: string;
  requestType: string;
  responseType: string;
  hasProtobufContract: boolean;
  hasImplementation: boolean;
  rpcName?: string;
}

export interface ContractValidationResult {
  valid: boolean;
  errors: ContractValidationError[];
  warnings: ContractValidationWarning[];
}

export interface ContractValidationError {
  serviceName: string;
  messagePattern: string;
  errorType: ContractErrorType;
  message: string;
}

export interface ContractValidationWarning {
  serviceName: string;
  messagePattern: string;
  message: string;
}

export interface ContractDiscoveryResult {
  contracts: DiscoveredContract[];
  total: number;
  withProtobuf: number;
  withImplementation: number;
  missingContracts: string[];
  missingImplementations: string[];
}
