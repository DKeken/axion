#!/usr/bin/env bun
/**
 * Скрипт для валидации соответствия proto файлов и констант MessagePattern
 *
 * Проверяет, что все RPC методы из proto файлов имеют соответствующие
 * константы в constants.ts
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Извлекает RPC методы из proto файла
 */
async function extractRpcMethods(protoPath: string): Promise<{
  serviceName: string;
  methods: string[];
}> {
  const content = await readFile(protoPath, "utf-8");

  // Извлекаем имя сервиса
  const serviceMatch = content.match(/service\s+(\w+Service)\s*{/);
  if (!serviceMatch) {
    throw new Error(`Cannot find service name in ${protoPath}`);
  }

  const serviceName = serviceMatch[1];

  // Извлекаем все RPC методы
  const rpcMatches = content.matchAll(/rpc\s+(\w+)\s*\(/g);
  const methods = Array.from(rpcMatches, (m) => m[1]).filter(
    (m) => m !== "HealthCheck"
  );

  return { serviceName, methods };
}

/**
 * Конвертирует RPC имя в MessagePattern
 */
function rpcToMessagePattern(rpcName: string, serviceName: string): string {
  // Конвертируем PascalCase в camelCase
  const action = rpcName.charAt(0).toLowerCase() + rpcName.slice(1);

  // Конвертируем ServiceName в service-name (с суффиксом -service)
  const serviceKebab = serviceName
    .replace(/Service$/, "")
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .substring(1);

  return `${serviceKebab}-service.${action}`;
}

/**
 * Извлекает константы из constants/index.ts и patterns/*.ts
 */
async function extractConstants(): Promise<Map<string, string[]>> {
  const patternsDir = join(process.cwd(), "src", "constants", "patterns");
  const patternFiles = (await readdir(patternsDir)).filter((f) =>
    f.endsWith(".ts")
  );

  const constants = new Map<string, string[]>();

  for (const patternFile of patternFiles) {
    const patternPath = join(patternsDir, patternFile);
    const content = await readFile(patternPath, "utf-8");

    // Извлекаем имя константы (например, GRAPH_SERVICE_PATTERNS)
    const constantMatch = content.match(/export const (\w+_SERVICE_PATTERNS)/);
    if (!constantMatch) continue;

    const serviceName = constantMatch[1];
    const patternsContent = content;

    const valueMatches = patternsContent.matchAll(/:\s*"([^"]+)"/g);
    const patterns = Array.from(valueMatches, (m) => m[1]);

    constants.set(serviceName, patterns);
  }

  return constants;
}

/**
 * Валидирует соответствие proto файлов и констант
 */
async function validateConstants(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const protoDir = join(process.cwd(), "proto");
  const protoFiles = (await readdir(protoDir, { recursive: true })).filter(
    (f) => f.endsWith("-service.proto") && !f.includes("common")
  );

  const constants = await extractConstants();

  for (const protoFile of protoFiles) {
    const protoPath = join(protoDir, protoFile);

    // Проверяем, что файл содержит service определение
    const content = await readFile(protoPath, "utf-8");
    if (!content.match(/service\s+\w+Service\s*{/)) {
      continue; // Пропускаем файлы без service
    }

    const { serviceName, methods } = await extractRpcMethods(protoPath);

    // Находим соответствующие константы
    const serviceKey = Object.keys(Object.fromEntries(constants)).find((key) =>
      key.includes(serviceName.replace("Service", "").toUpperCase())
    );

    if (!serviceKey) {
      warnings.push(
        `No constants found for service ${serviceName} in ${protoFile}`
      );
      continue;
    }

    const serviceConstants = constants.get(serviceKey) || [];

    // Проверяем каждый метод
    for (const method of methods) {
      const expectedPattern = rpcToMessagePattern(method, serviceName);
      const hasConstant = serviceConstants.includes(expectedPattern);

      if (!hasConstant) {
        errors.push(
          `Missing constant for ${serviceName}.${method}: expected "${expectedPattern}"`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Главная функция
 */
async function main() {
  try {
    const result = await validateConstants();

    if (result.errors.length > 0) {
      console.error("❌ Validation failed:");
      result.errors.forEach((error) => console.error(`  - ${error}`));
    }

    if (result.warnings.length > 0) {
      console.warn("⚠️  Warnings:");
      result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }

    if (result.valid) {
      console.log("✅ All constants are valid!");
    }

    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
