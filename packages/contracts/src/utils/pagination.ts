/**
 * Pagination utilities
 * Uses generated Pagination type directly from Protobuf
 */

import type { Pagination as GeneratedPagination } from "../../generated/common/common";

// Re-export Pagination type from generated
export type { Pagination } from "../../generated/common/common";

// Use alias for internal usage
type Pagination = GeneratedPagination;

export type PaginationParams = {
  page: number;
  limit: number;
}

export type PaginatedResult<T> = {
  items: T[];
  pagination: Pagination;
}

export function createFullPagination(
  params: PaginationParams,
  total: number
): Pagination {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  };
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function createPaginatedResult<T>(
  items: T[],
  pagination: Pagination
): PaginatedResult<T> {
  return { items, pagination };
}

export function validatePaginationParams(
  page: number,
  limit: number,
  maxLimit: number = 100
): PaginationParams {
  if (page < 1) throw new Error("Page must be greater than 0");
  if (limit < 1) throw new Error("Limit must be greater than 0");
  if (limit > maxLimit) throw new Error(`Limit cannot exceed ${maxLimit}`);
  return { page, limit };
}

export function createDefaultPagination(
  page?: number,
  limit?: number
): PaginationParams {
  return validatePaginationParams(page || 1, limit || 10);
}

export function hasNextPage(pagination: Pagination): boolean {
  return pagination.page < pagination.totalPages;
}

export function hasPreviousPage(pagination: Pagination): boolean {
  return pagination.page > 1;
}
