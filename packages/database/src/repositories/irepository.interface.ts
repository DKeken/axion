/**
 * IRepository Interface
 * Generic interface for repository pattern across different ORMs
 */

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

/**
 * Generic Repository Interface
 * Defines standard CRUD operations that all repositories should implement
 *
 * @template TEntity - Entity type (e.g., Project, User)
 * @template TCreate - Create DTO type
 * @template TUpdate - Update DTO type (usually Partial<TCreate>)
 */
export interface IRepository<
  TEntity,
  TCreate = TEntity,
  TUpdate = Partial<TCreate>
> {
  /**
   * Create a new entity
   */
  create(data: TCreate): Promise<TEntity>;

  /**
   * Find entity by ID
   */
  findById(id: string): Promise<TEntity | null>;

  /**
   * Update entity by ID
   */
  update(id: string, data: TUpdate): Promise<TEntity | null>;

  /**
   * Delete entity by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Find all entities with pagination
   */
  findAll(options?: PaginationOptions): Promise<PaginatedResult<TEntity>>;

  /**
   * Count all entities
   */
  count(): Promise<number>;

  /**
   * Check if entity exists by ID
   */
  exists(id: string): Promise<boolean>;
}
