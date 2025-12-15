import { readFile } from "fs/promises";
import { join } from "path";

import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { VALIDATION_PATTERNS } from "@/codegen/constants/validation.constants";
import { StructuralValidatorService } from "@/codegen/services/validators/structural-validator.service";
import type { ContractValidationResult } from "@/codegen/types/validation.types";

/**
 * Contract Validator Service
 * Проверяет что все MessagePattern имеют контракты, все контракты реализованы
 */
@Injectable()
export class ContractValidatorService extends BaseService {
  constructor(
    private readonly structuralValidator: StructuralValidatorService
  ) {
    super(ContractValidatorService.name);
  }

  /**
   * Валидирует контракты в сгенерированном коде
   * @param codePath - путь к сгенерированному коду
   * @param protoFiles - Map с именами сервисов и их proto файлами
   * @returns результат валидации
   */
  @CatchError({ operation: "validating contracts" })
  async validate(
    codePath: string,
    _protoFiles: Map<string, string>
  ): Promise<ContractValidationResult> {
    const errors: Array<{ pattern: string; message: string; file?: string }> =
      [];
    const missingContracts: string[] = [];
    const unusedContracts: string[] = [];

    try {
      // Находим все контроллеры
      const controllerFiles = await this.findControllerFiles(codePath);

      // Извлекаем все MessagePattern из кода
      const patternsInCode = new Set<string>();
      for (const controllerFile of controllerFiles) {
        const filePath = join(codePath, controllerFile);
        const content = await readFile(filePath, "utf-8");

        // Ищем MessagePattern
        const messageMatches = Array.from(
          content.matchAll(VALIDATION_PATTERNS.MESSAGE_PATTERN)
        );
        for (const match of messageMatches) {
          patternsInCode.add(match[1] || "");
        }

        // Ищем EventPattern
        const eventMatches = Array.from(
          content.matchAll(VALIDATION_PATTERNS.EVENT_PATTERN)
        );
        for (const match of eventMatches) {
          patternsInCode.add(match[1] || "");
        }
      }

      // Извлекаем все паттерны из proto файлов
      const patternsInProto = new Set<string>();
      for (const [, protoContent] of _protoFiles.entries()) {
        const servicePatterns = this.extractPatternsFromProto(protoContent);
        servicePatterns.forEach((pattern) => patternsInProto.add(pattern));
      }

      // Проверяем, что все паттерны из кода есть в proto
      for (const pattern of patternsInCode) {
        if (!patternsInProto.has(pattern)) {
          missingContracts.push(pattern);
          errors.push({
            pattern,
            message: `MessagePattern '${pattern}' found in code but not defined in proto files`,
          });
        }
      }

      // Проверяем, что все паттерны из proto используются в коде
      for (const pattern of patternsInProto) {
        if (!patternsInCode.has(pattern)) {
          unusedContracts.push(pattern);
          errors.push({
            pattern,
            message: `Pattern '${pattern}' defined in proto but not used in code`,
          });
        }
      }

      const valid = errors.length === 0;

      if (valid) {
        this.logger.debug(
          `Contract validation passed: ${patternsInCode.size} patterns validated`
        );
      } else {
        this.logger.warn(
          `Contract validation failed: ${missingContracts.length} missing, ${unusedContracts.length} unused`
        );
      }

      return {
        valid,
        errors,
        missingContracts,
        unusedContracts,
      };
    } catch (error) {
      this.logger.error(`Contract validation error for ${codePath}`, error);
      return {
        valid: false,
        errors: [
          {
            pattern: "",
            message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        missingContracts: [],
        unusedContracts: [],
      };
    }
  }

  /**
   * Находит все контроллеры в коде
   */
  private async findControllerFiles(codePath: string): Promise<string[]> {
    const controllerFiles: string[] = [];

    try {
      const allFiles = await this.structuralValidator.listFiles(codePath);

      for (const file of allFiles) {
        if (file.includes(".controller.ts") && !file.includes("health")) {
          controllerFiles.push(file);
        }
      }
    } catch (error) {
      this.logger.error("Error finding controller files", error);
    }

    return controllerFiles;
  }

  /**
   * Извлекает паттерны из proto файла
   */
  private extractPatternsFromProto(protoContent: string): string[] {
    const patterns: string[] = [];

    // Ищем rpc методы в proto файле
    const rpcRegex = /rpc\s+(\w+)\s*\([^)]+\)/g;
    const matches = Array.from(protoContent.matchAll(rpcRegex));

    for (const match of matches) {
      // Преобразуем имя метода в паттерн (пример: GetUser -> user.get)
      const methodName = match[1] || "";
      const pattern = this.methodNameToPattern(methodName);
      patterns.push(pattern);
    }

    return patterns;
  }

  /**
   * Преобразует имя метода в паттерн
   */
  private methodNameToPattern(methodName: string): string {
    // Простая эвристика: GetUser -> user.get, CreateProduct -> product.create
    const lower = methodName.toLowerCase();
    if (lower.startsWith("get")) {
      return `${lower.replace("get", "").toLowerCase()}.get`;
    }
    if (lower.startsWith("create")) {
      return `${lower.replace("create", "").toLowerCase()}.create`;
    }
    if (lower.startsWith("update")) {
      return `${lower.replace("update", "").toLowerCase()}.update`;
    }
    if (lower.startsWith("delete")) {
      return `${lower.replace("delete", "").toLowerCase()}.delete`;
    }
    if (lower.startsWith("list")) {
      return `${lower.replace("list", "").toLowerCase()}.list`;
    }

    return lower;
  }
}
