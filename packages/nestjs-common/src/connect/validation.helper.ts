import { createErrorResponse, createValidationError } from "@axion/contracts";
import { Message, create } from "@bufbuild/protobuf";
import { type GenMessage } from "@bufbuild/protobuf/codegenv2";
import { createValidator, type Violation } from "@bufbuild/protovalidate";
import { Logger } from "@nestjs/common";

const validator = createValidator();
const logger = new Logger("ConnectValidation");

/**
 * Higher-order function to wrap a Connect-RPC handler with ProtoValidate validation.
 *
 * **This is the recommended approach for Connect-RPC handlers.**
 *
 * Automatically validates incoming requests using buf.validate annotations from proto files.
 * Returns properly typed error responses on validation failure.
 *
 * @param reqSchema The Protobuf Schema for the Request message
 * @param resSchema The Protobuf Schema for the Response message
 * @param handler The original handler function
 * @returns A new handler function with validation logic
 *
 * @example
 * ```typescript
 * import { withValidation } from "@axion/nestjs-common";
 * import {
 *   CreateProjectRequestSchema,
 *   CreateProjectResponseSchema
 * } from "@axion/contracts";
 *
 * @Controller()
 * export class GraphController implements ConnectRpcProvider {
 *   createRouter(): (router: ConnectRouter) => void {
 *     return (router: ConnectRouter) => {
 *       router.service(GraphService, {
 *         createProject: withValidation(
 *           CreateProjectRequestSchema,
 *           CreateProjectResponseSchema,
 *           async (req) => {
 *             // Request is already validated here
 *             return this.graphService.createProject(req);
 *           }
 *         ),
 *       });
 *     };
 *   }
 * }
 * ```
 */
export function withValidation<TReq extends Message, TRes extends Message>(
  reqSchema: GenMessage<TReq>,
  resSchema: GenMessage<TRes>,
  handler: (req: TReq) => Promise<TRes>
) {
  return async (req: TReq): Promise<TRes> => {
    const result = validator.validate(reqSchema, req);

    if (result.kind !== "valid") {
      const violations = result.violations as Violation[];

      logger.warn(`Validation failed for ${reqSchema.typeName}`, {
        violations: violations.map((v) => ({
          field: v.field?.toString() || "unknown",
          message: v.message,
        })),
      });

      const firstViolation = violations[0];
      const errorResponse = createErrorResponse(
        createValidationError(
          firstViolation?.message || "Validation failed",
          firstViolation?.field?.toString() || ""
        )
      );

      // We construct the response using the schema.
      // The response message has a standard structure with a 'result' oneof
      // containing an 'error' case that accepts an Error from ServiceResponse.
      // This matches the standard Axion contract patterns.
      return create(resSchema, {
        result: { case: "error", value: errorResponse.result.value },
      } as unknown as TRes);
    }

    return handler(req);
  };
}
