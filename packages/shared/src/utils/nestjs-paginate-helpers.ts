/**
 * nestjs-paginate helpers - обертки для удобства использования
 *
 * Рекомендуется использовать nestjs-paginate напрямую в новом коде.
 * Эти хелперы помогают быстро настроить пагинацию для типичных случаев.
 */

import { PAGINATION_DEFAULTS, SortOrder } from "@axion/contracts";
import type { PaginateConfig } from "nestjs-paginate";

/**
 * Создать базовую конфигурацию пагинации
 *
 * @example
 * ```typescript
 * const config = createPaginateConfig({
 *   sortableColumns: ['createdAt', 'name'],
 *   filterableColumns: { name: true },
 *   defaultSortBy: [['createdAt', 'DESC']],
 * });
 * ```
 */
export function createPaginateConfig<T>(options: {
  sortableColumns: string[];
  filterableColumns?: Record<string, boolean>;
  defaultSortBy?: [string, SortOrder][];
  defaultLimit?: number;
  maxLimit?: number;
}): PaginateConfig<T> {
  return {
    sortableColumns: options.sortableColumns as never,
    filterableColumns: options.filterableColumns as never,
    defaultSortBy: options.defaultSortBy as never,
    defaultLimit: options.defaultLimit || PAGINATION_DEFAULTS.DEFAULT_LIMIT,
    maxLimit: options.maxLimit || PAGINATION_DEFAULTS.MAX_LIMIT,
  };
}

/**
 * Конвертировать pagination parameters из query
 */
export function parsePaginationQuery(query: Record<string, unknown>): {
  page?: number;
  limit?: number;
} {
  const page = query.page ? parseInt(String(query.page), 10) : undefined;
  const limit = query.limit ? parseInt(String(query.limit), 10) : undefined;

  return { page, limit };
}

/**
 * Примеры конфигураций для типичных случаев
 */

// Пример: Projects pagination
// Используем функцию, чтобы избежать проблем с порядком инициализации (SortOrder может быть undefined)
export const getProjectsPaginateConfig = (): PaginateConfig<unknown> => ({
  sortableColumns: ["createdAt", "updatedAt", "name"] as never,
  filterableColumns: {
    name: true,
    userId: true,
  } as never,
  defaultSortBy: [["createdAt", SortOrder.DESC]] as never,
  defaultLimit: PAGINATION_DEFAULTS.DEFAULT_LIMIT,
  maxLimit: PAGINATION_DEFAULTS.MAX_LIMIT,
});

// Пример: Services pagination
export const getServicesPaginateConfig = (): PaginateConfig<unknown> => ({
  sortableColumns: ["createdAt", "name", "type"] as never,
  filterableColumns: {
    name: true,
    type: true,
    projectId: true,
  } as never,
  defaultSortBy: [["createdAt", SortOrder.DESC]] as never,
  defaultLimit: 20,
  maxLimit: PAGINATION_DEFAULTS.MAX_LIMIT,
});
