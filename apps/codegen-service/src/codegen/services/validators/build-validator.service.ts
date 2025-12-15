import { exec } from "child_process";
import { promisify } from "util";

import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { VALIDATION_TIMEOUTS } from "@/codegen/constants/validation.constants";
import type { BuildValidationResult } from "@/codegen/types/validation.types";

const execAsync = promisify(exec);

/**
 * Build Validator Service
 * Выполняет `bun run build` для проверки компиляции
 */
@Injectable()
export class BuildValidatorService extends BaseService {
  constructor() {
    super(BuildValidatorService.name);
  }

  /**
   * Валидирует сборку кода
   * @param codePath - путь к сгенерированному коду
   * @returns результат валидации
   */
  @CatchError({ operation: "validating build" })
  async validate(codePath: string): Promise<BuildValidationResult> {
    try {
      // Выполняем bun run build
      const { stdout, stderr } = await execAsync("bun run build", {
        cwd: codePath,
        timeout: VALIDATION_TIMEOUTS.BUILD,
      });

      const output = stdout || stderr || "";

      // Проверяем наличие ошибок в выводе
      const errors = this.parseBuildErrors(output);

      const valid = errors.length === 0;

      if (valid) {
        this.logger.debug(`Build validation passed for ${codePath}`);
      } else {
        this.logger.warn(
          `Build validation failed for ${codePath}: ${errors.length} errors`
        );
      }

      return {
        valid,
        errors,
        output,
      };
    } catch (error) {
      this.logger.error(`Build validation error for ${codePath}`, error);

      const errorOutput =
        error instanceof Error && "stderr" in error
          ? (error as { stderr: string }).stderr
          : error instanceof Error
            ? error.message
            : String(error);

      const errors = this.parseBuildErrors(errorOutput);

      return {
        valid: false,
        errors,
        output: errorOutput,
      };
    }
  }

  /**
   * Парсит ошибки из вывода сборки
   */
  private parseBuildErrors(
    output: string
  ): Array<{ message: string; file?: string }> {
    const errors: Array<{ message: string; file?: string }> = [];

    // Ищем паттерны ошибок в выводе
    const errorPatterns = [
      /error\s+(?:TS\d+)?:\s*(.+)/gi,
      /Error:\s*(.+)/gi,
      /Failed to compile/i,
      /Build failed/i,
    ];

    for (const pattern of errorPatterns) {
      const matches = Array.from(output.matchAll(pattern));
      for (const match of matches) {
        if (match[1]) {
          errors.push({
            message: match[1].trim(),
          });
        }
      }
    }

    // Если не нашли конкретных ошибок, но есть вывод, считаем это ошибкой
    if (errors.length === 0 && output.toLowerCase().includes("error")) {
      errors.push({
        message: "Build failed (see output for details)",
      });
    }

    return errors;
  }
}
