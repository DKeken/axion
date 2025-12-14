import { BaseRepository } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, desc } from "drizzle-orm";

import { db } from "@/database";
import {
  blueprints,
  type Blueprint,
  type CreateBlueprint,
  type UpdateBlueprint,
} from "@/database/schema";

@Injectable()
export class BlueprintRepository extends BaseRepository<
  typeof blueprints,
  Blueprint,
  CreateBlueprint,
  UpdateBlueprint
> {
  constructor() {
    super(db, blueprints);
  }

  /**
   * Find blueprints by category
   * @param category - Category string from DB enum (e.g., "crud", "auth", etc.)
   */
  async findByCategory(category: string): Promise<Blueprint[]> {
    // Category is a pgEnum, drizzle requires the exact enum value
    // We need to ensure the category matches one of the enum values
    const validCategories = [
      "unspecified",
      "crud",
      "auth",
      "payment",
      "notification",
      "analytics",
      "custom",
    ] as const;

    if (
      !validCategories.includes(category as (typeof validCategories)[number])
    ) {
      return [];
    }

    return this.db
      .select()
      .from(this.table)
      .where(
        eq(blueprints.category, category as (typeof validCategories)[number])
      )
      .orderBy(desc(blueprints.createdAt));
  }

  /**
   * Find all blueprints ordered by creation date
   * Returns all blueprints (no pagination for blueprints)
   */
  async findAllBlueprints(): Promise<Blueprint[]> {
    return this.db
      .select()
      .from(this.table)
      .orderBy(desc(blueprints.createdAt));
  }
}
