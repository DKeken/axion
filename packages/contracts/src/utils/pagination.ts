/**
 * Pagination utilities and constants
 */

import { create } from "@bufbuild/protobuf";
import { type Pagination, PaginationSchema } from "../../generated/common/common_pb";

/**
 * Default pagination values
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100,
  // Backward compatibility aliases
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Sort order enum
 */
export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

/**
 * Create a full pagination object with total count
 */
export function createFullPagination(
  page: number,
  limit: number,
  total: number
): Pagination {
  return create(PaginationSchema, {
    page,
    limit,
    total,
  });
}

/**
 * Create pagination with defaults
 */
export function createPagination(
  page?: number,
  limit?: number
): Pagination {
  return create(PaginationSchema, {
    page: page ?? PAGINATION_DEFAULTS.page,
    limit: limit ?? PAGINATION_DEFAULTS.limit,
    total: 0,
  });
}

/**
 * Calculate offset from page and limit
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total pages from total items and limit
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Extract pagination parameters from request
 * Provides defaults if pagination is not provided
 *
 * @example
 * ```typescript
 * const { page, limit } = extractPagination(data.pagination);
 * const offset = calculateOffset(page, limit);
 * ```
 */
export function extractPagination(pagination?: Pagination | null | undefined): {
  page: number;
  limit: number;
} {
  return {
    page: pagination?.page || PAGINATION_DEFAULTS.page,
    limit: pagination?.limit || PAGINATION_DEFAULTS.limit,
  };
}

