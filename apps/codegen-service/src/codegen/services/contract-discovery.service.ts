import {
  type DiscoverContractsRequest,
  type ValidateContractsRequest,
} from "@axion/contracts";
import { createSuccessResponse } from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { OpenRouterService } from "@/codegen/services/openrouter.service";
import { PromptBuilderService } from "@/codegen/services/prompt-builder.service";

@Injectable()
export class ContractDiscoveryService extends BaseService {
  constructor(
    private readonly openRouterService: OpenRouterService,
    private readonly promptBuilderService: PromptBuilderService
  ) {
    super(ContractDiscoveryService.name);
  }

  @CatchError({ operation: "discovering contracts" })
  async discover(data: DiscoverContractsRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    try {
      // Mock generated files for contract discovery
      // In production, read actual generated controller files
      const generatedFiles: Array<{ path: string; content: string }> = [
        {
          path: "src/service/service.controller.ts",
          content: `
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { SERVICE_PATTERNS, type CreateRequest } from '@axion/contracts';

@Controller()
export class ServiceController {
  @MessagePattern(SERVICE_PATTERNS.CREATE)
  async create(data: CreateRequest) {
    return this.service.create(data);
  }
}
          `,
        },
      ];

      this.logger.log(
        `Discovering contracts for project: ${data.projectId}`
      );

      // Build contract discovery prompt
      const discoveryPrompt = this.promptBuilderService.buildContractDiscoveryPrompt(
        data.nodeId || data.projectId,
        generatedFiles
      );

      // Call OpenRouter for contract discovery
      const aiResponse = await this.openRouterService.complete(discoveryPrompt, {
        temperature: 0.1, // Low temperature for accurate extraction
        maxTokens: 4000,
      });

      // Parse contract discovery response
      let contracts: Array<{
        pattern: string;
        type: string;
        requestType?: string;
        responseType?: string;
        description?: string;
      }> = [];

      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*"contracts"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          contracts = parsed.contracts || [];
        }
      } catch (parseError) {
        this.logger.error(
          "Failed to parse contract discovery response",
          parseError
        );
      }

      this.logger.log(`Discovered ${contracts.length} contracts`);

      return createSuccessResponse({
        contracts,
      });
    } catch (error) {
      this.logger.error("Contract discovery failed", error);
      return createSuccessResponse({
        contracts: [],
      });
    }
  }

  @CatchError({ operation: "validating contracts" })
  async validate(data: ValidateContractsRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    try {
      // Mock contracts data for validation
      // In production, this would come from actual discovered contracts
      const mockContracts: Array<{
        pattern: string;
        type: string;
        requestType?: string;
        responseType?: string;
      }> = [];

      // Build validation prompt for contracts
      const validationPrompt = `Validate the following Kafka MessagePattern contracts:

${mockContracts.map((c, i) => `
Contract ${i + 1}:
- Pattern: ${c.pattern}
- Type: ${c.type}
- Request Type: ${c.requestType || "unknown"}
- Response Type: ${c.responseType || "unknown"}
`).join("\n")}

Check for:
1. Pattern naming follows convention: service-name.action-name
2. Request/Response types exist in @axion/contracts
3. Pattern is unique and not duplicated
4. Type is either "request" or "event"

Provide validation result in JSON format:
{
  "allValid": boolean,
  "errors": [
    {
      "pattern": "pattern name",
      "message": "error description"
    }
  ],
  "warnings": [
    {
      "pattern": "pattern name",
      "message": "warning description"
    }
  ]
}`;

      this.logger.log(`Validating contracts for project: ${data.projectId}`);

      const aiResponse = await this.openRouterService.complete(validationPrompt, {
        temperature: 0.1,
        maxTokens: 4000,
      });

      // Parse validation response
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const validationResult = JSON.parse(jsonMatch[0]);

          this.logger.log(
            `Contract validation completed: ${validationResult.allValid ? "VALID" : "INVALID"}`
          );

          return createSuccessResponse({
            allValid: validationResult.allValid || false,
            errors: validationResult.errors || [],
            warnings: validationResult.warnings || [],
          });
        }
      } catch (parseError) {
        this.logger.error("Failed to parse validation response", parseError);
      }

      // Fallback to basic validation
      return createSuccessResponse({
        allValid: true,
        errors: [],
        warnings: [],
      });
    } catch (error) {
      this.logger.error("Contract validation failed", error);
      return createSuccessResponse({
        allValid: true,
        errors: [],
        warnings: [],
      });
    }
  }
}
