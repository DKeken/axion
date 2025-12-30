import type { RequestMetadata } from "@axion/contracts";
import { createKafkaHeaders, getCorrelationIdFromHeaders } from "@axion/shared";
import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { Injectable, NestInterceptor } from "@nestjs/common";
import type { ClientKafka } from "@nestjs/microservices";
import type { Observable } from "rxjs";


/**
 * Kafka Headers Interceptor
 * Automatically adds standard headers (correlationId, causationId, userId, projectId)
 * to Kafka messages when sending via ClientKafka
 */
@Injectable()
export class KafkaHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Only intercept Kafka client calls
    if (context.getType() !== "rpc") {
      return next.handle();
    }

    // Get the client and metadata from context
    const client = context.switchToRpc().getContext<{
      client?: ClientKafka;
      pattern?: string;
      data?: { metadata?: RequestMetadata };
    }>();

    // Extract metadata from request data
    const metadata = client.data?.metadata;
    if (!metadata) {
      return next.handle();
    }

    // Get correlationId from existing headers or generate new
    const existingHeaders = (client as { headers?: Record<string, string> })
      .headers;
    const correlationId = existingHeaders
      ? getCorrelationIdFromHeaders(existingHeaders)
      : undefined;

    // Create standard headers
    const headers = createKafkaHeaders(metadata, correlationId);

    // Attach headers to client context
    // Note: NestJS Kafka client doesn't directly support headers in send(),
    // but we can store them in context for later use
    (client as { headers?: Record<string, string> }).headers = {
      ...existingHeaders,
      ...headers,
    };

    return next.handle();
  }
}
