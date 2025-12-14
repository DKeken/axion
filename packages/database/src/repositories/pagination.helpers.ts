/**
 * Pagination helpers for repositories
 * Reduces boilerplate in repository pagination methods
 */

import { PAGINATION_DEFAULTS } from "@axion/contracts";
import type { PaginationOptions, PaginatedResult } from "./base.repository";

/**
 * Apply pagination to an array of items
 * Helper for simple in-memory pagination when you have all items
 *
 * @example
 * ```typescript
 * async findByUserId(userId: string, page: number = 1, limit: number = 10) {
 *   const allProjects = await this.db
 *     .select()
 *     .from(this.table)
 *     .where(eq(this.table.userId, userId))
 *     .orderBy(desc(this.table.createdAt));
 *
 *   return applyPagination(allProjects, { page, limit });
 * }
 * ```
 */
export function applyPagination<T>(
  items: T[],
  options: PaginationOptions = {}
): PaginatedResult<T> {
  const page = options.page || PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const limit = options.limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
  };
}

/**
 * Calculate pagination offset from page and limit
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
