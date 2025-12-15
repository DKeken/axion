import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";

import {
  VALIDATION_PATTERNS,
  VALIDATION_TIMEOUTS,
} from "@/codegen/constants/validation.constants";
import type { TypeScriptValidationResult } from "@/codegen/types/validation.types";

const execAsync = promisify(exec);

/**
 * TypeScript Validator Service
 * Выполняет `tsc --noEmit` для проверки типов
 */
@Injectable()
export class TypeScriptValidatorService extends BaseService {
  constructor() {
    super(TypeScriptValidatorService.name);
  }

  /**
   * Валидирует TypeScript код
   * @param codePath - путь к сгенерированному коду
   * @returns результат валидации
   */
  @CatchError({ operation: "validating TypeScript" })
  async validate(codePath: string): Promise<TypeScriptValidationResult> {
    try {
      // Выполняем tsc --noEmit
      const { stdout, stderr } = await execAsync("tsc --noEmit", {
        cwd: codePath,
        timeout: VALIDATION_TIMEOUTS.TYPESCRIPT,
      });

      const output = stdout || stderr || "";

      // Парсим ошибки из вывода
      const errors = this.parseTypeScriptErrors(output);

      const valid = errors.length === 0;

      if (valid) {
        this.logger.debug(`TypeScript validation passed for ${codePath}`);
      } else {
        this.logger.warn(
          `TypeScript validation failed for ${codePath}: ${errors.length} errors`
        );
      }

      return {
        valid,
        errors,
        output,
      };
    } catch (error) {
      this.logger.error(`TypeScript validation error for ${codePath}`, error);

      // Если команда завершилась с ошибкой, парсим stderr
      const errorOutput =
        error instanceof Error && "stderr" in error
          ? (error as { stderr: string }).stderr
          : error instanceof Error
            ? error.message
            : String(error);

      const errors = this.parseTypeScriptErrors(errorOutput);

      return {
        valid: false,
        errors,
        output: errorOutput,
      };
    }
  }

  /**
   * Парсит ошибки из вывода tsc
   */
  private parseTypeScriptErrors(
    output: string
  ): Array<{ file: string; line?: number; column?: number; message: string }> {
    const errors: Array<{
      file: string;
      line?: number;
      column?: number;
      message: string;
    }> = [];

    // Формат ошибки: file.ts(line,column): error TS1234: message
    const errorRegex = VALIDATION_PATTERNS.TYPESCRIPT_ERROR;

    let match;
    while ((match = errorRegex.exec(output)) !== null) {
      errors.push({
        file: match[1]?.trim() || "",
        line: parseInt(match[2] || "0", 10) || undefined,
        column: parseInt(match[3] || "0", 10) || undefined,
        message: match[6]?.trim() || "",
      });
    }

    return errors;
  }
}
