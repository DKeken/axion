/**
 * Contract Validation - валидация контрактов
 */

import { ContractErrorType } from "../../generated/common/common";
import { messagePatternToRpc, isValidMessagePattern } from "../contract-utils";

import type { DiscoveredContract, ContractValidationResult } from "./types";

export function validateMessagePatternContract(
  messagePattern: string,
  protobufRpcName: string,
  serviceName: string
): ContractValidationResult {
  const errors: ContractValidationResult["errors"] = [];
  const warnings: ContractValidationResult["warnings"] = [];

  if (!isValidMessagePattern(messagePattern)) {
    errors.push({
      serviceName,
      messagePattern,
      errorType: ContractErrorType.CONTRACT_ERROR_TYPE_MISSING_CONTRACT,
      message: `Invalid message pattern format: ${messagePattern}`,
    });
    return { valid: false, errors, warnings };
  }

  const expectedRpcName = messagePatternToRpc(messagePattern);
  if (expectedRpcName !== protobufRpcName) {
    errors.push({
      serviceName,
      messagePattern,
      errorType: ContractErrorType.CONTRACT_ERROR_TYPE_TYPE_MISMATCH,
      message: `MessagePattern "${messagePattern}" does not match Protobuf RPC "${protobufRpcName}". Expected: "${expectedRpcName}"`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateContractImplementation(
  contract: DiscoveredContract
): ContractValidationResult {
  const errors: ContractValidationResult["errors"] = [];
  const warnings: ContractValidationResult["warnings"] = [];

  if (!contract.hasProtobufContract) {
    errors.push({
      serviceName: contract.serviceName,
      messagePattern: contract.messagePattern,
      errorType: ContractErrorType.CONTRACT_ERROR_TYPE_MISSING_CONTRACT,
      message: `Protobuf contract not found for message pattern: ${contract.messagePattern}`,
    });
  }

  if (!contract.hasImplementation) {
    errors.push({
      serviceName: contract.serviceName,
      messagePattern: contract.messagePattern,
      errorType: ContractErrorType.CONTRACT_ERROR_TYPE_MISSING_IMPLEMENTATION,
      message: `Implementation not found for message pattern: ${contract.messagePattern}`,
    });
  }

  if (contract.hasProtobufContract && !contract.hasImplementation) {
    warnings.push({
      serviceName: contract.serviceName,
      messagePattern: contract.messagePattern,
      message: `Protobuf contract exists but implementation is missing for: ${contract.messagePattern}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateContracts(
  contracts: DiscoveredContract[]
): ContractValidationResult {
  const allErrors: ContractValidationResult["errors"] = [];
  const allWarnings: ContractValidationResult["warnings"] = [];

  for (const contract of contracts) {
    const result = validateContractImplementation(contract);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
