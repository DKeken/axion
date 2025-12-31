/**
 * Pagination utilities for services
 * Reduces boilerplate when working with paginated requests
 */

import { createFullPagination } from "@axion/contracts";

/**
 * Common pagination query parameters for HTTP handlers
 */
export type PaginationQuery = {
  page?: string;
  limit?: string;
};

/**
 * Create paginated response helper
 * Combines items with pagination metadata
 *
 * @example
 * ```typescript
 * const { items, total } = await repository.findByUserId(userId, page, limit);
 * return createPaginatedResponse({ items, total }, { page, limit });
 * ```
 */
export function createPaginatedResponse<T>(
  data: { items: T[]; total: number },
  pagination: { page: number; limit: number }
): { items: T[]; pagination: ReturnType<typeof createFullPagination> } {
  return {
    items: data.items,
    pagination: createFullPagination(
      pagination.page,
      pagination.limit,
      data.total
    ),
  };
}
