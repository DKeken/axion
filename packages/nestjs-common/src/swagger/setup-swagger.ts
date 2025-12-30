import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export type SwaggerOptions = {
  /**
   * Service name (e.g., "Graph Service")
   */
  serviceName: string;
  /**
   * API version (e.g., "v1")
   */
  apiVersion?: string;
  /**
   * API description
   */
  description?: string;
  /**
   * Swagger UI path (default: "/api-docs")
   */
  swaggerPath?: string;
}

/**
 * Setup Swagger/OpenAPI documentation for a NestJS microservice
 *
 * @example
 * ```typescript
 * import { setupSwagger } from "@axion/nestjs-common";
 *
 * const app = await NestFactory.create(AppModule);
 * setupSwagger(app, {
 *   serviceName: "Graph Service",
 *   apiVersion: "v1",
 *   description: "Graph Service API for managing projects and graphs",
 * });
 * ```
 */
export function setupSwagger(
  app: INestApplication,
  options: SwaggerOptions
): void {
  const {
    serviceName,
    apiVersion = "v1",
    description = `${serviceName} API`,
    swaggerPath = "/api-docs",
  } = options;

  const config = new DocumentBuilder()
    .setTitle(serviceName)
    .setDescription(description)
    .setVersion(apiVersion)
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Better Auth session token",
      },
      "bearer"
    )
    .addTag("health", "Health check endpoints")
    .addTag("api", "Public API endpoints")
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  });

  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
    customSiteTitle: `${serviceName} API Documentation`,
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
    `,
  });
}
