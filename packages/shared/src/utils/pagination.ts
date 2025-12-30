/**
 * Pagination utilities for services
 * Reduces boilerplate when working with paginated requests
 */

import type { Pagination } from "@axion/contracts";
import { createFullPagination, PAGINATION_DEFAULTS } from "@axion/contracts";

/**
 * Common pagination query parameters for HTTP handlers
 */
export type PaginationQuery = {
  page?: string;
  limit?: string;
};

/**
 * Extract pagination parameters from request
 * Provides defaults if pagination is not provided
 *
 * @example
 * ```typescript
 * const { page, limit } = extractPagination(data.pagination);
 * ```
 */
export function extractPagination(pagination?: Pagination | null | undefined): {
  page: number;
  limit: number;
} {
  return {
    page: pagination?.page || PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: pagination?.limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT,
  };
}

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
    pagination: createFullPagination(pagination, data.total),
  };
}
