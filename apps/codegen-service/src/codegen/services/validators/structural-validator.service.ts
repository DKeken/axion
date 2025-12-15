import { readdir, stat } from "fs/promises";
import { join } from "path";

import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { REQUIRED_FILES } from "@/codegen/constants/validation.constants";
import type { StructuralValidationResult } from "@/codegen/types/validation.types";

/**
 * Structural Validator Service
 * Проверяет наличие всех обязательных файлов из Blueprint
 */
@Injectable()
export class StructuralValidatorService extends BaseService {
  constructor() {
    super(StructuralValidatorService.name);
  }

  /**
   * Валидирует структуру сгенерированного сервиса
   * @param codePath - путь к сгенерированному коду
   * @param requiredFiles - список обязательных файлов (опционально)
   * @returns результат валидации
   */
  @CatchError({ operation: "validating structure" })
  async validate(
    codePath: string,
    requiredFiles: string[] = [...REQUIRED_FILES]
  ): Promise<StructuralValidationResult> {
    const errors: Array<{ file: string; message: string }> = [];
    const missingFiles: string[] = [];

    try {
      // Проверяем существование базовой директории
      const baseStat = await stat(codePath).catch(() => null);
      if (!baseStat || !baseStat.isDirectory()) {
        return {
          valid: false,
          errors: [
            {
              file: codePath,
              message: "Code path does not exist or is not a directory",
            },
          ],
          missingFiles: requiredFiles,
        };
      }

      // Проверяем наличие всех обязательных файлов
      for (const file of requiredFiles) {
        const filePath = join(codePath, file);
        try {
          const fileStat = await stat(filePath);
          if (!fileStat.isFile()) {
            missingFiles.push(file);
            errors.push({
              file,
              message: `Required file exists but is not a file: ${file}`,
            });
          }
        } catch {
          missingFiles.push(file);
          errors.push({
            file,
            message: `Required file not found: ${file}`,
          });
        }
      }

      const valid = errors.length === 0;

      if (valid) {
        this.logger.debug(
          `Structural validation passed for ${codePath} (${requiredFiles.length} files checked)`
        );
      } else {
        this.logger.warn(
          `Structural validation failed for ${codePath}: ${missingFiles.length} files missing`
        );
      }

      return {
        valid,
        errors,
        missingFiles,
      };
    } catch (error) {
      this.logger.error(`Structural validation error for ${codePath}`, error);
      return {
        valid: false,
        errors: [
          {
            file: codePath,
            message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        missingFiles: requiredFiles,
      };
    }
  }

  /**
   * Получает список всех файлов в директории (рекурсивно)
   */
  @CatchError({ operation: "listing files" })
  async listFiles(directoryPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await readdir(directoryPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(directoryPath, entry.name);
        if (entry.isDirectory()) {
          const subFiles = await this.listFiles(fullPath);
          files.push(...subFiles.map((f) => join(entry.name, f)));
        } else if (entry.isFile()) {
          files.push(entry.name);
        }
      }
    } catch (error) {
      this.logger.error(`Error listing files in ${directoryPath}`, error);
      throw error;
    }

    return files;
  }
}
