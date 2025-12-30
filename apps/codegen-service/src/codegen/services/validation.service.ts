import {
  type ValidateProjectRequest,
  type ValidateServiceRequest,
  ValidationStatus,
} from "@axion/contracts";
import {
  createErrorResponse,
  createNotFoundError,
  createSuccessResponse,
  createValidationError,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable, Inject, forwardRef } from "@nestjs/common";

import { transformValidationStatus } from "@/codegen/helpers/type-transformers";
import { GenerationHistoryRepository } from "@/codegen/repositories/generation-history.repository";
import { ValidationResultRepository } from "@/codegen/repositories/validation-result.repository";
import { BuildValidatorService } from "@/codegen/services/validators/build-validator.service";
import { ContractDiscoveryValidatorService } from "@/codegen/services/validators/contract-discovery-validator.service";
import { ContractValidatorService } from "@/codegen/services/validators/contract-validator.service";
import { HealthCheckValidatorService } from "@/codegen/services/validators/health-check-validator.service";
import { StructuralValidatorService } from "@/codegen/services/validators/structural-validator.service";
import { TypeScriptValidatorService } from "@/codegen/services/validators/typescript-validator.service";

/**
 * Validation Service
 * Координирует валидацию сгенерированного кода через 6 уровней валидации
 */
@Injectable()
export class ValidationService extends BaseService {
  constructor(
    @Inject(forwardRef(() => GenerationHistoryRepository))
    private readonly generationHistoryRepository: GenerationHistoryRepository,
    @Inject(forwardRef(() => ValidationResultRepository))
    private readonly validationResultRepository: ValidationResultRepository,
    private readonly structuralValidator: StructuralValidatorService,
    private readonly contractValidator: ContractValidatorService,
    private readonly typescriptValidator: TypeScriptValidatorService,
    private readonly buildValidator: BuildValidatorService,
    private readonly healthCheckValidator: HealthCheckValidatorService,
    private readonly contractDiscoveryValidator: ContractDiscoveryValidatorService
  ) {
    super(ValidationService.name);
    console.log("ValidationService initialized with:", {
      generationHistoryRepository: !!this.generationHistoryRepository,
      validationResultRepository: !!this.validationResultRepository,
      structuralValidator: !!this.structuralValidator,
      contractValidator: !!this.contractValidator,
      typescriptValidator: !!this.typescriptValidator,
      buildValidator: !!this.buildValidator,
      healthCheckValidator: !!this.healthCheckValidator,
      contractDiscoveryValidator: !!this.contractDiscoveryValidator,
    });
  }

  @CatchError({ operation: "validating project" })
  async validateProject(data: ValidateProjectRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    // Get all generation history for project
    const histories = await this.generationHistoryRepository.findByProjectId(
      data.projectId
    );

    if (histories.length === 0) {
      return createSuccessResponse({
        results: [],
        totalServices: 0,
        validated: 0,
        failed: 0,
      });
    }

    const results = [];

    for (const history of histories) {
      if (!history.generatedCodePath || !history.nodeId) {
        continue;
      }

      const result = await this.validateServiceCode(
        history.generatedCodePath,
        data.projectId,
        history.nodeId,
        history.serviceId || null,
        history.id,
        history.serviceName || "unknown"
      );

      results.push(result);
    }

    return createSuccessResponse({
      results,
      totalServices: results.length,
      validated: results.filter(
        (r) => r.status === ValidationStatus.VALIDATION_STATUS_VALIDATED
      ).length,
      failed: results.filter(
        (r) => r.status === ValidationStatus.VALIDATION_STATUS_ERROR
      ).length,
    });
  }

  @CatchError({ operation: "validating service" })
  async validateService(data: ValidateServiceRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    if (!data.nodeId) {
      return createErrorResponse(createValidationError("nodeId is required"));
    }

    // Get generation history for service
    const history = await this.generationHistoryRepository.findLatestByService(
      data.projectId,
      data.nodeId
    );

    if (!history) {
      return createErrorResponse(
        createNotFoundError("Generation history", data.nodeId)
      );
    }

    if (!history.generatedCodePath) {
      return createErrorResponse(
        createValidationError("No generated code path found")
      );
    }

    const result = await this.validateServiceCode(
      history.generatedCodePath,
      data.projectId,
      data.nodeId,
      history.serviceId || null,
      history.id,
      history.serviceName || "unknown"
    );

    return createSuccessResponse(result);
  }

  /**
   * Выполняет валидацию кода сервиса через все 6 уровней
   */
  @CatchError({ operation: "validating service code" })
  private async validateServiceCode(
    codePath: string,
    projectId: string,
    nodeId: string,
    serviceId: string | null,
    generationHistoryId: string,
    serviceName: string
  ) {
    // Проверяем существующий результат валидации
    let validationResult =
      await this.validationResultRepository.findLatestByService(
        projectId,
        nodeId
      );

    if (!validationResult) {
      validationResult = await this.validationResultRepository.create({
        projectId,
        nodeId,
        serviceId,
        generationHistoryId,
        status: "pending",
        levelResults: {
          structuralPassed: false,
          contractPassed: false,
          typescriptPassed: false,
          buildPassed: false,
          healthCheckPassed: false,
          contractDiscoveryPassed: false,
        },
        errors: [],
      });
    }

    const errors: Array<{
      level: string;
      message: string;
      file?: string;
      line?: number;
      column?: number;
    }> = [];

    // 1. Structural Validation
    this.logger.log(`[1/6] Structural validation for ${serviceName}`);
    const structuralResult = await this.structuralValidator.validate(codePath);
    if (!structuralResult.valid) {
      errors.push(
        ...structuralResult.errors.map(
          (e: { file: string; message: string }) => ({
            level: "structural",
            message: e.message,
            file: e.file,
          })
        )
      );
    }

    // 2. Contract Validation (требует proto файлы)
    this.logger.log(`[2/6] Contract validation for ${serviceName}`);
    const protoContracts = new Map<string, string>(); // TODO: Загрузить реальные proto файлы
    const contractResult = await this.contractValidator.validate(
      codePath,
      protoContracts
    );
    if (!contractResult.valid) {
      errors.push(
        ...contractResult.errors.map(
          (e: { pattern: string; message: string; file?: string }) => ({
            level: "contract",
            message: e.message,
            file: e.file,
          })
        )
      );
    }

    // 3. TypeScript Validation
    this.logger.log(`[3/6] TypeScript validation for ${serviceName}`);
    const typescriptResult = await this.typescriptValidator.validate(codePath);
    if (!typescriptResult.valid) {
      errors.push(
        ...typescriptResult.errors.map((e) => ({
          level: "typescript",
          message: e.message,
          file: e.file,
          line: e.line,
          column: e.column,
        }))
      );
    }

    // 4. Build Validation (только если TypeScript валидация прошла)
    let buildResult: {
      valid: boolean;
      errors: Array<{ message: string; file?: string }>;
      output: string;
    } = { valid: true, errors: [], output: "" };
    if (typescriptResult.valid) {
      this.logger.log(`[4/6] Build validation for ${serviceName}`);
      buildResult = await this.buildValidator.validate(codePath);
      if (!buildResult.valid) {
        errors.push(
          ...buildResult.errors.map((e) => ({
            level: "build",
            message: e.message,
            file: e.file,
          }))
        );
      }
    } else {
      this.logger.warn(
        `Skipping build validation for ${serviceName} (TypeScript validation failed)`
      );
    }

    // 5. Health Check Validation (только если build прошел)
    let healthCheckResult: {
      valid: boolean;
      errors: Array<{ endpoint: string; message: string }>;
      healthCheckPassed: boolean;
      messagePatternsPassed: boolean;
    } = {
      valid: true,
      errors: [],
      healthCheckPassed: false,
      messagePatternsPassed: false,
    };
    if (buildResult.valid) {
      this.logger.log(`[5/6] Health check validation for ${serviceName}`);
      healthCheckResult = await this.healthCheckValidator.validate(codePath);
      if (!healthCheckResult.valid) {
        errors.push(
          ...healthCheckResult.errors.map((e) => ({
            level: "healthCheck",
            message: e.message,
            file: e.endpoint,
          }))
        );
      }
    } else {
      this.logger.warn(
        `Skipping health check validation for ${serviceName} (Build validation failed)`
      );
    }

    // 6. Contract Discovery Validation
    this.logger.log(`[6/6] Contract discovery validation for ${serviceName}`);
    const contractDiscoveryResult =
      await this.contractDiscoveryValidator.validate(codePath, serviceName);
    if (!contractDiscoveryResult.valid) {
      errors.push(
        ...contractDiscoveryResult.errors.map((e) => ({
          level: "contractDiscovery",
          message: e.message,
          file: e.pattern,
        }))
      );
    }

    // Обновляем результат валидации
    const finalStatus = errors.length === 0 ? "validated" : "error";
    const updated = await this.validationResultRepository.update(
      validationResult.id,
      {
        status: finalStatus,
        levelResults: {
          structuralPassed: structuralResult.valid,
          contractPassed: contractResult.valid,
          typescriptPassed: typescriptResult.valid,
          buildPassed: buildResult.valid,
          healthCheckPassed: healthCheckResult.healthCheckPassed,
          contractDiscoveryPassed: contractDiscoveryResult.valid,
        },
        errors,
      }
    );

    const finalResult = updated || validationResult;

    this.logger.log(
      `Validation completed for ${serviceName}: ${finalStatus} (${errors.length} errors)`
    );

    return {
      serviceId: finalResult.serviceId || "",
      nodeId: finalResult.nodeId || "",
      status: transformValidationStatus(finalResult.status),
      errors: finalResult.errors || [],
      levelResults: finalResult.levelResults || {
        structuralPassed: false,
        contractPassed: false,
        typescriptPassed: false,
        buildPassed: false,
        healthCheckPassed: false,
        contractDiscoveryPassed: false,
      },
    };
  }
}
