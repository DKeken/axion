import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";

import { ContractHttpResponseInterceptor } from "./contract-http-response.interceptor";
import { RequestContextInterceptor } from "./request-context.interceptor";

/**
 * Apply global HTTP layer for all Axion services.
 *
 * Includes:
 * - Request context interceptor (correlationId, metadata)
 * - Contract response interceptor (protobuf errors → HTTP status)
 * - Validation pipe (basic validation)
 *
 * Safe to call for services that expose only /health: interceptors are no-op
 * for non-contract responses.
 */
export function setupHttpContractLayer(app: INestApplication): void {
  // Request context interceptor (adds correlationId, ensures metadata)
  app.useGlobalInterceptors(new RequestContextInterceptor());

  // Contract response interceptor (maps protobuf errors to HTTP status)
  app.useGlobalInterceptors(new ContractHttpResponseInterceptor());

  // Global validation pipe (validates incoming data)
  // Note: ValidationPipe works with class-validator, but since we use protobuf types,
  // validation is optional. The pipe will only validate if DTOs have class-validator decorators.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Don't throw error for non-whitelisted properties
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
        exposeDefaultValues: true, // Expose default values in transformation
      },
      // Skip validation if no DTO/class-validator decorators are used
      // This allows protobuf types to work without class-validator
      skipMissingProperties: true,
      // Don't throw if validation fails (we handle errors in services)
      disableErrorMessages: false,
    })
  );
}
