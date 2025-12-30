/**
 * Types for contract validation and discovery
 */

import type { ContractErrorType } from "../../generated/common/common";

export type { ContractErrorType };

export type DiscoveredContract = {
  serviceName: string;
  messagePattern: string;
  requestType: string;
  responseType: string;
  hasProtobufContract: boolean;
  hasImplementation: boolean;
  rpcName?: string;
}

export type ContractValidationResult = {
  valid: boolean;
  errors: ContractValidationError[];
  warnings: ContractValidationWarning[];
}

export type ContractValidationError = {
  serviceName: string;
  messagePattern: string;
  errorType: ContractErrorType;
  message: string;
}

export type ContractValidationWarning = {
  serviceName: string;
  messagePattern: string;
  message: string;
}

export type ContractDiscoveryResult = {
  contracts: DiscoveredContract[];
  total: number;
  withProtobuf: number;
  withImplementation: number;
  missingContracts: string[];
  missingImplementations: string[];
}
