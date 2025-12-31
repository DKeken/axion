import {
  createErrorResponse,
  createValidationError,
  type ServiceResponse,
  ServiceResponseSchema,
} from "@axion/contracts";
import { create, type Message } from "@bufbuild/protobuf";
import type { GenMessage } from "@bufbuild/protobuf/codegenv2";
import { createValidator, type Violation } from "@bufbuild/protovalidate";
import type { Logger } from "@nestjs/common";

/**
 * ProtoValidator - Manual validation helper for services
 *
 * **Use this when you need manual validation in service methods.**
 * For Connect-RPC handlers, prefer `withValidation` from @axion/nestjs-common.
 *
 * @example
 * ```typescript
 * import { ProtoValidator } from "@axion/shared";
 * import { CreateProjectRequestSchema } from "@axion/contracts";
 *
 * @Injectable()
 * export class ProjectsService {
 *   private readonly protoValidator = new ProtoValidator();
 *
 *   async create(data: CreateProjectRequest): Promise<CreateProjectResponse> {
 *     // Manual validation in service
 *     const error = this.protoValidator.validateOrError(
 *       CreateProjectRequestSchema,
 *       data,
 *       this.logger
 *     );
 *     if (error) {
 *       return create(CreateProjectResponseSchema, {
 *         result: { case: "error", value: error }
 *       });
 *     }
 *
 *     // Business logic after validation
 *     const project = await this.repository.create(data);
 *     return createSuccessResponse(project);
 *   }
 * }
 * ```
 */
export class ProtoValidator {
  private readonly validator = createValidator();

  /**
   * Validates data against a Protobuf schema and returns an error response if invalid.
   * Returns null if validation passes.
   *
   * @param schema - Protobuf message schema to validate against
   * @param data - Data to validate
   * @param logger - Optional logger for validation warnings
   * @returns ServiceResponse with error if validation fails, null if valid
   */
  validateOrError<T extends Message>(
    schema: GenMessage<T>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    logger?: Logger
  ): ServiceResponse | null {
    const result = this.validator.validate(schema, data);

    if (result.kind === "valid") {
      return null; // No error
    }

    const violations = result.violations as Violation[];

    if (logger && violations.length > 0) {
      logger.warn("Validation failed", {
        violations: violations.map((v) => ({
          field: v.field?.toString() || "unknown",
          message: v.message,
        })),
      });
    }

    const firstViolation = violations[0];
    const errorResponse = createErrorResponse(
      createValidationError(
        firstViolation?.message || "Validation failed",
        firstViolation?.field?.toString() || ""
      )
    );

    return create(ServiceResponseSchema, errorResponse);
  }
}
