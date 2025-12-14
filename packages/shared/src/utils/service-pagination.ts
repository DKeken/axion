/**
 * Service-level pagination utilities
 * Extends base pagination with service-specific helpers
 */

import { createSuccessResponse } from "@axion/contracts";
import type { Pagination } from "@axion/contracts";
import { extractPagination, createPaginatedResponse } from "./pagination";

/**
 * Extract pagination and create success response with paginated data
 * Helper for list operations in services
 *
 * Returns structure compatible with Protobuf contracts:
 * - For ListProjectsResponse: { projects, pagination }
 * - For ListGraphVersionsResponse: { versions, pagination }
 * - For ListServicesResponse: { services, pagination }
 *
 * @example
 * ```typescript
 * async list(data: ListProjectsRequest) {
 *   const pagination = extractPagination(data.pagination);
 *   const { items, total } = await this.repository.findByUserId(userId, pagination.page, pagination.limit);
 *   return createSuccessPaginatedResponse(data.pagination, { items, total }, 'projects');
 * }
 * ```
 */
export function createSuccessPaginatedResponse<T>(
  requestPagination: Pagination | null | undefined,
  data: { items: T[]; total: number },
  itemsKey: string = "items"
) {
  const pagination = extractPagination(requestPagination);
  const paginated = createPaginatedResponse(data, pagination);

  // Return with custom items key (e.g., 'projects', 'versions', 'services')
  // This creates structure: { [itemsKey]: items[], pagination: Pagination }
  // Which matches Protobuf contract: { projects: Project[], pagination: Pagination }
  return createSuccessResponse({
    [itemsKey]: paginated.items,
    pagination: paginated.pagination,
  });
}
