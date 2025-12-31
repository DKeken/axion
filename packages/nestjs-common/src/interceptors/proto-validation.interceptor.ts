import { createErrorResponse, createValidationError } from "@axion/contracts";
import { Message, create } from "@bufbuild/protobuf";
import { type GenMessage } from "@bufbuild/protobuf/codegenv2";
import { createValidator, type Violation } from "@bufbuild/protovalidate";
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable, of } from "rxjs";

/**
 * @deprecated Use `withValidation` from @axion/nestjs-common for Connect-RPC handlers instead.
 * This interceptor is kept for backwards compatibility with legacy Kafka/MessagePattern handlers.
 *
 * For new code, prefer:
 * - Connect-RPC: `withValidation(reqSchema, resSchema, handler)`
 * - Manual validation: `ProtoValidator` from @axion/shared
 */

@Injectable()
export class ProtoValidationInterceptor<
  TReq extends Message,
  TRes extends Message,
> implements NestInterceptor {
  private readonly validator = createValidator();
  private readonly logger = new Logger(ProtoValidationInterceptor.name);

  constructor(
    private readonly reqSchema: GenMessage<TReq>,
    private readonly resSchema: GenMessage<TRes>
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = context.getType();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any;

    if (type === "rpc") {
      data = context.switchToRpc().getData();
    } else if (type === "http") {
      data = context.switchToHttp().getRequest().body;
    } else {
      // Fallback or specific handling
      data = context.getArgs()[0];
    }

    const result = this.validator.validate(this.reqSchema, data);

    if (result.kind === "valid") {
      return next.handle();
    }

    const violations = result.violations as Violation[];

    this.logger.warn(`Validation failed for ${this.reqSchema.typeName}`, {
      violations: violations?.map((v) => ({
        field: v.field?.toString() || "unknown",
        message: v.message,
      })),
    });

    const firstViolation = violations?.[0];
    const errorResponse = createErrorResponse(
      createValidationError(
        firstViolation?.message || "Validation failed",
        firstViolation?.field?.toString() || ""
      )
    );

    // Construct response with proper typing
    // The response schema has a standard structure with a 'result' oneof
    const response = create(this.resSchema, {
      result: { case: "error", value: errorResponse.result.value },
    } as unknown as TRes);

    return of(response);
  }
}
