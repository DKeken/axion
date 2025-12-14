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
import { Injectable } from "@nestjs/common";

import { transformValidationStatus } from "@/codegen/helpers/type-transformers";
import { type GenerationHistoryRepository } from "@/codegen/repositories/generation-history.repository";
import { type ValidationResultRepository } from "@/codegen/repositories/validation-result.repository";
import { OpenRouterService } from "@/codegen/services/openrouter.service";
import { PromptBuilderService } from "@/codegen/services/prompt-builder.service";

@Injectable()
export class ValidationService extends BaseService {
  constructor(
    private readonly generationHistoryRepository: GenerationHistoryRepository,
    private readonly validationResultRepository: ValidationResultRepository,
    private readonly openRouterService: OpenRouterService,
    private readonly promptBuilderService: PromptBuilderService
  ) {
    super(ValidationService.name);
  }

  @CatchError({ operation: "validating project" })
  async validateProject(data: ValidateProjectRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    // Get all generation history for project
    // Note: Project access is verified implicitly when generation was created
    const histories = await this.generationHistoryRepository.findByProjectId(
      data.projectId
    );

    if (histories.length === 0) {
      // No generation history means project hasn't been generated yet
      // This is not an error, just return empty results
      return createSuccessResponse({
        results: [],
        totalServices: 0,
        validated: 0,
        failed: 0,
      });
    }

    const results = [];

    for (const history of histories) {
      // Check if validation result already exists
      let validationResult =
        await this.validationResultRepository.findLatestByService(
          data.projectId,
          history.nodeId || ""
        );

      if (!validationResult) {
        // Create new validation result
        validationResult = await this.validationResultRepository.create({
          projectId: data.projectId,
          nodeId: history.nodeId || null,
          serviceId: history.serviceId || null,
          generationHistoryId: history.id,
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

      // Perform AI-powered validation if code was generated
      if (
        history.generatedCodePath &&
        history.status === "validated" &&
        validationResult.status === "pending"
      ) {
        try {
          // Mock generated files (in production, read from actual path)
          const generatedFiles: Array<{ path: string; content: string }> = [
            {
              path: "src/main.ts",
              content: "// Main entry point",
            },
          ];

          const validationPrompt =
            this.promptBuilderService.buildValidationPrompt(
              history.serviceName || "unknown",
              generatedFiles
            );

          this.logger.log(
            `Running AI validation for service: ${history.serviceName || history.nodeId}${data.aiModel ? ` using model: ${data.aiModel}` : ""}`
          );

          const aiResponse = await this.openRouterService.complete(
            validationPrompt,
            {
              temperature: 0.1,
              maxTokens: 4000,
              model: data.aiModel, // Use model from request or default
            }
          );

          // Parse validation response
          try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const validationReport = JSON.parse(jsonMatch[0]);

              const updated = await this.validationResultRepository.update(
                validationResult.id,
                {
                  status:
                    validationReport.errors?.length > 0 ? "error" : "validated",
                  levelResults: {
                    structuralPassed:
                      validationReport.structuralPassed || false,
                    contractPassed: validationReport.contractPassed || false,
                    typescriptPassed:
                      validationReport.typescriptPassed || false,
                    buildPassed: validationReport.buildPassed || false,
                    healthCheckPassed:
                      validationReport.healthCheckPassed || false,
                    contractDiscoveryPassed:
                      validationReport.contractDiscoveryPassed || false,
                  },
                  errors: validationReport.errors || [],
                }
              );

              if (updated) {
                validationResult = updated;
              }

              this.logger.log(
                `AI validation completed for ${history.serviceName || history.nodeId}`
              );
            }
          } catch (parseError) {
            this.logger.error(
              "Failed to parse AI validation response",
              parseError
            );
          }
        } catch (error) {
          this.logger.error("AI validation failed", error);
        }
      }

      // Add to results
      results.push({
        serviceId: validationResult.serviceId || "",
        nodeId: validationResult.nodeId || "",
        status: transformValidationStatus(validationResult.status),
        errors: validationResult.errors || [],
        levelResults: validationResult.levelResults || {
          structuralPassed: false,
          contractPassed: false,
          typescriptPassed: false,
          buildPassed: false,
          healthCheckPassed: false,
          contractDiscoveryPassed: false,
        },
      });
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

    // Check if validation result already exists
    const existing = await this.validationResultRepository.findLatestByService(
      data.projectId,
      data.nodeId
    );

    let validationResult;
    if (!existing) {
      // Create new validation result
      validationResult = await this.validationResultRepository.create({
        projectId: data.projectId,
        nodeId: data.nodeId,
        serviceId: history.serviceId || null,
        generationHistoryId: history.id,
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
    } else {
      validationResult = existing;
    }

    // Perform AI-powered validation if code was generated
    if (history.generatedCodePath && history.status === "validated") {
      try {
        // For now, we'll simulate file reading by using mock data
        // In production, you would read the actual files from the generated code path
        const generatedFiles: Array<{ path: string; content: string }> = [
          {
            path: "src/main.ts",
            content: "// Main entry point generated by AI",
          },
        ];

        // Build validation prompt
        const validationPrompt =
          this.promptBuilderService.buildValidationPrompt(
            history.serviceName || "unknown",
            generatedFiles
          );

        this.logger.log(
          `Running AI validation for service: ${history.serviceName || data.nodeId}${data.aiModel ? ` using model: ${data.aiModel}` : ""}`
        );

        // Call OpenRouter for validation
        const aiResponse = await this.openRouterService.complete(
          validationPrompt,
          {
            temperature: 0.1, // Very low temperature for consistent validation
            maxTokens: 4000,
            model: data.aiModel, // Use model from request or default
          }
        );

        // Parse validation response
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const validationReport = JSON.parse(jsonMatch[0]);

            // Update validation result with AI feedback
            const updatedResult = await this.validationResultRepository.update(
              validationResult.id,
              {
                status:
                  validationReport.errors?.length > 0 ? "error" : "validated",
                levelResults: {
                  structuralPassed: validationReport.structuralPassed || false,
                  contractPassed: validationReport.contractPassed || false,
                  typescriptPassed: validationReport.typescriptPassed || false,
                  buildPassed: validationReport.buildPassed || false,
                  healthCheckPassed:
                    validationReport.healthCheckPassed || false,
                  contractDiscoveryPassed:
                    validationReport.contractDiscoveryPassed || false,
                },
                errors: validationReport.errors || [],
              }
            );

            if (updatedResult) {
              validationResult = updatedResult;
            }

            this.logger.log(
              `AI validation completed for ${history.serviceName || data.nodeId}`
            );
          }
        } catch (parseError) {
          this.logger.error(
            "Failed to parse AI validation response",
            parseError
          );
          // Continue with existing validation result
        }
      } catch (error) {
        this.logger.error("AI validation failed", error);
        // Continue with existing validation result
      }
    }

    return createSuccessResponse({
      serviceId: validationResult.serviceId || "",
      nodeId: validationResult.nodeId || "",
      status: transformValidationStatus(validationResult.status),
      errors: validationResult.errors || [],
      levelResults: validationResult.levelResults || {
        structuralPassed: false,
        contractPassed: false,
        typescriptPassed: false,
        buildPassed: false,
        healthCheckPassed: false,
        contractDiscoveryPassed: false,
      },
    });
  }
}
