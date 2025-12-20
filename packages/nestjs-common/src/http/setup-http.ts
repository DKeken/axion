import type { INestApplication } from "@nestjs/common";

import { ContractHttpResponseInterceptor } from "./contract-http-response.interceptor";
import { RequestContextInterceptor } from "./request-context.interceptor";

/**
 * Apply global HTTP layer for all Axion services.
 *
 * Includes:
 * - Request context interceptor (correlationId, metadata)
 * - Contract response interceptor (protobuf errors → HTTP status)
 *
 * Safe to call for services that expose only /health: interceptors are no-op
 * for non-contract responses.
 */
export function setupHttpContractLayer(app: INestApplication): void {
  // Request context interceptor (adds correlationId, ensures metadata)
  app.useGlobalInterceptors(new RequestContextInterceptor());

  // Contract response interceptor (maps protobuf errors to HTTP status)
  app.useGlobalInterceptors(new ContractHttpResponseInterceptor());
}
