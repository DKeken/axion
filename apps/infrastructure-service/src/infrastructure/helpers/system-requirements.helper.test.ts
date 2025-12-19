/**
 * Unit tests for System Requirements Helper
 */

// @ts-expect-error - bun:test types are available at runtime
import { test, expect } from "bun:test";
import {
  calculateSystemRequirements,
  type SystemRequirementsInput,
} from "./system-requirements.helper";
import type { ServerInfo } from "@axion/contracts";

test("calculateSystemRequirements: basic calculation without server info", () => {
  const input: SystemRequirementsInput = {
    services: 5,
    averageCpuCores: 1,
    averageMemoryMb: 512,
    averageDiskGb: 1024,
    replicas: 2,
    overheadPercent: 0.2,
  };

  const result = calculateSystemRequirements(input);

  expect(result.requiredCpuCores).toBe(12); // 5 * 2 * 1 * 1.2 = 12
  expect(result.requiredMemoryMb).toBe(6144); // 5 * 2 * 512 * 1.2 = 6144
  expect(result.requiredDiskGb).toBe(12288); // 5 * 2 * 1024 * 1.2 = 12288
  expect(result.recommendedServers).toBeGreaterThan(0);
  expect(result.notes.length).toBeGreaterThan(0);
});

test("calculateSystemRequirements: with server info that fits", () => {
  const serverInfo: Partial<ServerInfo> = {
    cpuCores: 16,
    availableMemory: 16 * 1024 * 1024 * 1024, // 16 GB
    dockerInstalled: true,
  };

  const input: SystemRequirementsInput = {
    services: 3,
    averageCpuCores: 1,
    averageMemoryMb: 512,
    replicas: 2,
    overheadPercent: 0.2,
    serverInfo,
  };

  const result = calculateSystemRequirements(input);

  expect(result.fitsCurrentServer).toBe(true);
  expect(result.headroomPercent).toBeGreaterThan(0);
  expect(result.recommendedServers).toBe(1);
});

test("calculateSystemRequirements: with server info that does not fit", () => {
  const serverInfo: Partial<ServerInfo> = {
    cpuCores: 2,
    availableMemory: 2 * 1024 * 1024 * 1024, // 2 GB
    dockerInstalled: true,
  };

  const input: SystemRequirementsInput = {
    services: 10,
    averageCpuCores: 1,
    averageMemoryMb: 512,
    replicas: 2,
    overheadPercent: 0.2,
    serverInfo,
  };

  const result = calculateSystemRequirements(input);

  expect(result.fitsCurrentServer).toBe(false);
  expect(result.recommendedServers).toBeGreaterThan(1);
});

test("calculateSystemRequirements: defaults for missing values", () => {
  const input: SystemRequirementsInput = {
    services: 1,
  };

  const result = calculateSystemRequirements(input);

  expect(result.requiredCpuCores).toBeGreaterThan(0);
  expect(result.requiredMemoryMb).toBeGreaterThan(0);
  expect(result.requiredDiskGb).toBeGreaterThan(0);
  expect(result.recommendedServers).toBeGreaterThan(0);
});

test("calculateSystemRequirements: warns when Docker not installed", () => {
  const serverInfo: Partial<ServerInfo> = {
    cpuCores: 8,
    availableMemory: 8 * 1024 * 1024 * 1024,
    dockerInstalled: false,
  };

  const input: SystemRequirementsInput = {
    services: 2,
    serverInfo,
  };

  const result = calculateSystemRequirements(input);

  expect(result.notes.some((note) => note.includes("Docker"))).toBe(true);
});
