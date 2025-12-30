/**
 * Base Repository for Drizzle ORM
 * Provides common CRUD operations to reduce boilerplate
 */

import { PAGINATION_DEFAULTS } from "@axion/contracts";
import { eq, sql, and } from "drizzle-orm";
import type { InferSelectModel, InferInsertModel, SQL } from "drizzle-orm";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type {
  IRepository,
  PaginationOptions,
  PaginatedResult,
} from "./irepository.interface";

/**
 * Base repository type constraints
 */
export type BaseTable = PgTable & {
  id: PgColumn;
  createdAt?: PgColumn;
  updatedAt?: PgColumn;
};

export type BaseEntity = InferSelectModel<BaseTable>;
export type CreateEntity<T extends BaseTable> = InferInsertModel<T>;
export type UpdateEntity<T extends BaseTable> = Partial<CreateEntity<T>>;

/**
 * Base Repository class for common CRUD operations
 * Extend this class to create specific repositories
 *
 * @example
 * ```typescript
 * export class ProjectRepository extends BaseRepository<typeof projects, Project, CreateProject> {
 *   constructor() {
 *     super(db, projects);
 *   }
 *
 *   // Add custom methods here
 *   async findByUserId(userId: string, options?: PaginationOptions) {
 *     // Custom implementation
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<
  TTable extends BaseTable,
  TEntity extends BaseEntity = InferSelectModel<TTable>,
  TCreate extends CreateEntity<TTable> = InferInsertModel<TTable>,
  TUpdate extends UpdateEntity<TTable> = Partial<InferInsertModel<TTable>>,
  TSchema extends Record<string, unknown> = Record<string, unknown>,
> implements IRepository<TEntity, TCreate, TUpdate> {
  constructor(
    protected readonly db: PostgresJsDatabase<TSchema>,
    protected readonly table: TTable
  ) {}

  /**
   * Create a new entity
   */
  async create(data: TCreate): Promise<TEntity> {
    const [entity] = await this.db
      .insert(this.table)
      .values(data as InferInsertModel<TTable>)
      .returning();
    return entity as TEntity;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<TEntity | null> {
    const [entity] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id as PgColumn, id))
      .limit(1);
    return (entity as TEntity) || null;
  }

  /**
   * Update entity by ID
   * Automatically updates updatedAt if column exists
   */
  async update(id: string, data: TUpdate): Promise<TEntity | null> {
    const updateData = { ...data } as InferInsertModel<TTable>;

    // Automatically update updatedAt if column exists
    if (this.table.updatedAt) {
      // Drizzle requires dynamic property access for column names
      // Type assertion needed for runtime property assignment
      const updateDataRecord = updateData as {
        [key: string]: unknown;
      };
      updateDataRecord[this.table.updatedAt.name] = sql`now()`;
    }

    const [updated] = await this.db
      .update(this.table)
      .set(updateData)
      .where(eq(this.table.id as PgColumn, id))
      .returning();

    return (updated as TEntity) || null;
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id as PgColumn, id))
      .returning();
    return result.length > 0;
  }

  /**
   * Find all entities with pagination
   * Override this method for custom ordering/filtering
   */
  async findAll(
    options?: PaginationOptions
  ): Promise<PaginatedResult<TEntity>> {
    const page = options?.page || PAGINATION_DEFAULTS.DEFAULT_PAGE;
    const limit = options?.limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    const allItems = await this.db.select().from(this.table);
    const total = allItems.length;
    const paginated = allItems.slice(offset, offset + limit);

    return {
      items: paginated as TEntity[],
      total,
    };
  }

  /**
   * Find entities with pagination and filtering
   * Generic helper for common pagination patterns with where clause
   *
   * @example
   * ```typescript
   * async findByUserId(userId: string, page: number = 1, limit: number = 10) {
   *   return this.findPaginated(
   *     { userId }, // filter criteria
   *     { page, limit },
   *     desc(this.table.createdAt) // optional ordering
   *   );
   * }
   * ```
   */
  protected async findPaginated(
    where: Partial<TEntity>,
    options: PaginationOptions = {},
    // orderBy type is complex in Drizzle ORM
    // Accepts: PgColumn, SQL, or result of asc()/desc() functions
    orderBy?: SQL | PgColumn
  ): Promise<PaginatedResult<TEntity>> {
    const page = options.page || PAGINATION_DEFAULTS.DEFAULT_PAGE;
    const limit = options.limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    // Build where clause - use type-safe access to table columns
    const whereConditions = Object.entries(where)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        // Drizzle tables don't have index signature for dynamic column access
        // Type assertion is necessary for runtime column lookup by string key
        // This is a known TypeScript limitation with dynamic property access
        const tableRecord = this.table as unknown as Record<
          string,
          PgColumn | undefined
        >;
        const column = tableRecord[key];
        if (!column || !("name" in column)) return null;
        return eq(column, value);
      })
      .filter((condition): condition is SQL => condition !== null);

    // Build query
    const baseQuery = this.db.select().from(this.table);

    const queryWithWhere =
      whereConditions.length > 0
        ? baseQuery.where(and(...whereConditions))
        : baseQuery;

    // Apply ordering if provided
    // Drizzle's orderBy has complex overloads that TypeScript can't infer in generic context
    // Type assertion is necessary for type safety while maintaining flexibility
    const finalQuery = orderBy
      ? (
          queryWithWhere.orderBy as (
            orderBy: SQL | PgColumn
          ) => typeof queryWithWhere
        )(orderBy)
      : queryWithWhere;

    const allItems = await finalQuery;
    const total = allItems.length;
    const paginated = allItems.slice(offset, offset + limit);

    return {
      items: paginated as TEntity[],
      total,
    };
  }

  /**
   * Count all entities
   */
  async count(): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table);
    return Number(result[0]?.count || 0);
  }

  /**
   * Check if entity exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }
}
