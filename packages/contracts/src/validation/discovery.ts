/**
 * Contract Discovery - обнаружение контрактов
 */

import {
  messagePatternToRpc,
  extractServiceName,
  isValidMessagePattern,
} from "../contract-utils";

import type { DiscoveredContract, ContractDiscoveryResult } from "./types";

export function createDiscoveredContract(
  messagePattern: string,
  requestType: string,
  responseType: string,
  hasProtobufContract: boolean = false,
  hasImplementation: boolean = false
): DiscoveredContract {
  if (!isValidMessagePattern(messagePattern)) {
    throw new Error(`Invalid message pattern: ${messagePattern}`);
  }

  return {
    serviceName: extractServiceName(messagePattern),
    messagePattern,
    requestType,
    responseType,
    hasProtobufContract,
    hasImplementation,
    rpcName: messagePatternToRpc(messagePattern),
  };
}

export function discoverContracts(
  messagePatterns: string[],
  protobufContracts: Map<string, { requestType: string; responseType: string }>,
  implementations: Set<string>
): ContractDiscoveryResult {
  const contracts: DiscoveredContract[] = [];
  const missingContracts: string[] = [];
  const missingImplementations: string[] = [];

  for (const messagePattern of messagePatterns) {
    const contractInfo = protobufContracts.get(messagePattern);
    const hasProtobuf = !!contractInfo;
    const hasImplementation = implementations.has(messagePattern);

    if (!hasProtobuf) missingContracts.push(messagePattern);
    if (!hasImplementation) missingImplementations.push(messagePattern);

    contracts.push(
      createDiscoveredContract(
        messagePattern,
        contractInfo?.requestType || "Unknown",
        contractInfo?.responseType || "Unknown",
        hasProtobuf,
        hasImplementation
      )
    );
  }

  return {
    contracts,
    total: contracts.length,
    withProtobuf: contracts.filter((c) => c.hasProtobufContract).length,
    withImplementation: contracts.filter((c) => c.hasImplementation).length,
    missingContracts,
    missingImplementations,
  };
}

export function filterContractsByService(
  contracts: DiscoveredContract[],
  serviceName: string
): DiscoveredContract[] {
  return contracts.filter((c) => c.serviceName === serviceName);
}

export function groupContractsByService(
  contracts: DiscoveredContract[]
): Map<string, DiscoveredContract[]> {
  const grouped = new Map<string, DiscoveredContract[]>();
  for (const contract of contracts) {
    const existing = grouped.get(contract.serviceName) || [];
    existing.push(contract);
    grouped.set(contract.serviceName, existing);
  }
  return grouped;
}

export function findMissingProtobufContracts(
  contracts: DiscoveredContract[]
): DiscoveredContract[] {
  return contracts.filter((c) => !c.hasProtobufContract);
}

export function findMissingImplementations(
  contracts: DiscoveredContract[]
): DiscoveredContract[] {
  return contracts.filter((c) => !c.hasImplementation);
}

export function areAllContractsComplete(
  contracts: DiscoveredContract[]
): boolean {
  return contracts.every((c) => c.hasProtobufContract && c.hasImplementation);
}

export function generateContractReport(
  result: ContractDiscoveryResult
): string {
  const lines: string[] = [];
  lines.push("Contract Discovery Report");
  lines.push("=".repeat(50));
  lines.push(`Total contracts: ${result.total}`);
  lines.push(`With Protobuf: ${result.withProtobuf}`);
  lines.push(`With Implementation: ${result.withImplementation}`);
  lines.push("");

  if (result.missingContracts.length > 0) {
    lines.push("Missing Protobuf Contracts:");
    result.missingContracts.forEach((pattern) => {
      lines.push(`  - ${pattern}`);
    });
    lines.push("");
  }

  if (result.missingImplementations.length > 0) {
    lines.push("Missing Implementations:");
    result.missingImplementations.forEach((pattern) => {
      lines.push(`  - ${pattern}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}
