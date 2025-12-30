import { createDefaultPagination, type Pagination } from "@axion/contracts";
import { type PaginationQuery } from "@axion/shared";

export { type PaginationQuery };

const toPositiveIntOrUndefined = (value?: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.floor(parsed);
};

/**
 * Normalize pagination from query params into a Protobuf-compatible Pagination.
 * Defaults: page=1, limit=10; total/totalPages are left zeroed for services to fill.
 */
export const normalizePagination = (query?: PaginationQuery): Pagination => {
  const page = toPositiveIntOrUndefined(query?.page);
  const limit = toPositiveIntOrUndefined(query?.limit);
  const params = createDefaultPagination(page, limit);

  return {
    page: params.page,
    limit: params.limit,
    total: 0,
    totalPages: 0,
  };
};
