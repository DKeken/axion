import type { INestApplication } from "@nestjs/common";

import { ContractHttpResponseInterceptor } from "./contract-http-response.interceptor";

/**
 * Apply global HTTP layer for all Axion services.
 *
 * Safe to call for services that expose only /health: interceptor is a no-op
 * for non-contract responses.
 */
export function setupHttpContractLayer(app: INestApplication): void {
  app.useGlobalInterceptors(new ContractHttpResponseInterceptor());
}

