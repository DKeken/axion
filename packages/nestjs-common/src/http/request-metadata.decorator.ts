import type { RequestMetadata } from "@axion/contracts";
import type { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";


type RequestWithAxionContext = {
  axion?: {
    metadata?: RequestMetadata;
    userId?: string;
    session?: unknown;
  };
};

/**
 * Read RequestMetadata injected by HttpAuthGuard.
 *
 * Usage:
 *   handler(@AxionRequestMetadata() metadata: RequestMetadata) { ... }
 */
export const AxionRequestMetadata = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestMetadata | undefined => {
    const req = ctx.switchToHttp().getRequest<RequestWithAxionContext>();
    return req?.axion?.metadata;
  }
);

