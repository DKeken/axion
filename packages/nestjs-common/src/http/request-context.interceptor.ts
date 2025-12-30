import { randomUUID } from "node:crypto";

import type { RequestMetadata } from "@axion/contracts";
import { createRequestMetadata } from "@axion/shared";
import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { Injectable, NestInterceptor } from "@nestjs/common";
import type { Observable } from "rxjs";


type RequestWithAxionContext = {
  axion?: {
    metadata?: RequestMetadata;
    userId?: string;
    session?: unknown;
    correlationId?: string;
  };
  headers?: Record<string, string | string[] | undefined>;
};

/**
 * Request Context Interceptor
 * Adds correlationId to request context and ensures metadata is properly set
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<RequestWithAxionContext>();

    // Extract or generate correlationId
    const correlationId =
      (req.headers?.["x-correlation-id"] as string) ||
      (req.headers?.["x-request-id"] as string) ||
      randomUUID();

    // Ensure axion context exists
    if (!req.axion) {
      req.axion = {};
    }

    // Update metadata with correlationId if userId exists
    if (req.axion.userId) {
      // Use correlationId as requestId for tracking
      req.axion.metadata = createRequestMetadata(
        req.axion.userId,
        undefined,
        correlationId
      );
      // Also store correlationId separately for easy access
      req.axion.correlationId = correlationId;
    } else {
      // Store correlationId even if no user (for anonymous requests)
      req.axion.correlationId = correlationId;
    }

    // Add correlationId to response headers
    const res = context.switchToHttp().getResponse<{
      setHeader: (key: string, value: string) => void;
    }>();
    res.setHeader("X-Correlation-ID", correlationId);

    return next.handle();
  }
}
