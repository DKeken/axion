import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import type { ContractDiscoveryValidationResult } from "@/codegen/types/validation.types";

/**
 * Contract Discovery Validator Service
 * Проверяет что ContractDiscoveryService успешно валидирует все контракты при запуске
 */
@Injectable()
export class ContractDiscoveryValidatorService extends BaseService {
  constructor() {
    super(ContractDiscoveryValidatorService.name);
  }

  /**
   * Валидирует контракты через ContractDiscoveryService
   * @param codePath - путь к сгенерированному коду
   * @param serviceName - имя сервиса
   * @returns результат валидации
   */
  @CatchError({ operation: "validating contract discovery" })
  async validate(
    codePath: string,
    serviceName: string
  ): Promise<ContractDiscoveryValidationResult> {
    const errors: Array<{ pattern: string; message: string }> = [];

    try {
      // Используем ContractDiscoveryService для обнаружения контрактов
      // В production это будет вызываться при запуске сервиса
      this.logger.debug(
        `Contract discovery validation for ${serviceName} at ${codePath}`
      );

      // Симуляция: в production здесь будет реальный вызов ContractDiscoveryService
      // который анализирует код и извлекает контракты
      const discoveredContracts = 0; // Пока 0, так как не реализован полный анализ

      // Проверяем что контракты были обнаружены
      if (discoveredContracts === 0) {
        errors.push({
          pattern: "",
          message: "No contracts discovered in service code",
        });
      }

      const valid = errors.length === 0;

      if (valid) {
        this.logger.debug(
          `Contract discovery validation passed for ${serviceName} (${discoveredContracts} contracts)`
        );
      } else {
        this.logger.warn(
          `Contract discovery validation failed for ${serviceName}`
        );
      }

      return {
        valid,
        errors,
        discoveredContracts,
      };
    } catch (error) {
      this.logger.error(
        `Contract discovery validation error for ${codePath}`,
        error
      );
      return {
        valid: false,
        errors: [
          {
            pattern: "",
            message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        discoveredContracts: 0,
      };
    }
  }
}
