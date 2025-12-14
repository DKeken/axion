/**
 * Base Service for NestJS microservices
 * Provides common methods for access verification and validation
 * Reduces boilerplate in service classes
 */

import type { RequestMetadata, Pagination } from "@axion/contracts";
import {
  createErrorResponse,
  createValidationError,
  createNotFoundError,
} from "@axion/contracts";
import { getUserIdFromMetadata } from "../helpers/metadata";
import {
  verifyResourceAccess,
  type AccessVerificationResult,
} from "../helpers/access-control";
import { extractPagination, createSuccessPaginatedResponse } from "../utils";
import { Logger } from "@nestjs/common";

/**
 * Error response type
 */
export type ErrorResponse = ReturnType<typeof createErrorResponse>;

/**
 * Resource access configuration for verifyResourceAccess
 */
export interface ResourceAccessConfig<TResource> {
  findById: (id: string) => Promise<TResource | null>;
  getOwnerId: (resource: TResource) => string;
  resourceName: string;
}

/**
 * Metadata validation result
 */
export type MetadataValidationResult =
  | { success: true; userId: string }
  | { success: false; response: ErrorResponse };

/**
 * Base Service class with common utilities
 * Extend this class to create specific services
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ProjectsService extends BaseService {
 *   constructor(
 *     private readonly projectRepository: ProjectRepository
 *   ) {
 *     super(ProjectsService.name);
 *   }
 *
 *   async create(data: CreateProjectRequest) {
 *     const metadataCheck = this.validateMetadata(data.metadata);
 *     if (!metadataCheck.success) return metadataCheck.response;
 *
 *     const project = await this.projectRepository.create({
 *       userId: metadataCheck.userId,
 *       name: data.name,
 *     });
 *
 *     return createSuccessResponse(project);
 *   }
 * }
 * ```
 */
export abstract class BaseService {
  protected readonly logger: Logger;

  constructor(serviceName: string) {
    this.logger = new Logger(serviceName);
  }

  /**
   * Validate metadata and extract userId
   * Use this when there's no resourceId to check access
   * (e.g., for create/list operations)
   */
  protected validateMetadata(
    metadata: RequestMetadata | unknown
  ): MetadataValidationResult {
    const userId = getUserIdFromMetadata(metadata);
    if (!userId) {
      return {
        success: false,
        response: createErrorResponse(
          createValidationError("user_id is required in metadata")
        ),
      };
    }

    return { success: true, userId };
  }

  /**
   * Verify resource access
   * Generic helper that works with any resource type
   */
  protected async verifyResourceAccess<TResource>(
    config: ResourceAccessConfig<TResource>,
    resourceId: string,
    metadata: RequestMetadata | unknown
  ): Promise<AccessVerificationResult> {
    return verifyResourceAccess(config, resourceId, metadata);
  }

  /**
   * Check if resource exists and return error if not found
   */
  protected createNotFoundResponse(
    resourceName: string,
    resourceId: string
  ): ErrorResponse {
    return createErrorResponse(createNotFoundError(resourceName, resourceId));
  }

  /**
   * Create validation error response
   */
  protected createValidationResponse(
    message: string,
    field?: string
  ): ErrorResponse {
    return createErrorResponse(createValidationError(message, field));
  }

  /**
   * Extract pagination parameters from request
   * Provides defaults if pagination is not provided
   */
  protected extractPagination(pagination?: Pagination | null | undefined): {
    page: number;
    limit: number;
  } {
    return extractPagination(pagination);
  }

  /**
   * Create success response with paginated data
   * Helper for list operations
   * @param itemsKey - Key name for items in response (e.g., 'projects', 'versions', 'services')
   */
  protected createSuccessPaginatedResponse<T>(
    requestPagination: Pagination | null | undefined,
    data: { items: T[]; total: number },
    itemsKey: string = "items"
  ) {
    return createSuccessPaginatedResponse(requestPagination, data, itemsKey);
  }
}
