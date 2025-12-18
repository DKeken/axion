import { PAGINATION_DEFAULTS } from "@axion/contracts";
import { BaseRepository, applyPagination } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, desc, sql } from "drizzle-orm";

import { db } from "@/database";
import {
  projects,
  type Project,
  type CreateProject,
  type UpdateProject,
} from "@/database/schema";

@Injectable()
export class ProjectRepository extends BaseRepository<
  typeof projects,
  Project,
  CreateProject,
  UpdateProject
> {
  constructor() {
    super(db, projects);
  }

  /**
   * Find projects by user ID with pagination
   */
  async findByUserId(
    userId: string,
    page: number = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT
  ): Promise<{ projects: Project[]; total: number }> {
    const allProjects = await this.db
      .select()
      .from(this.table)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));

    const { items, total } = applyPagination(allProjects, { page, limit });
    return { projects: items, total };
  }

  async countByUserId(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(eq(projects.userId, userId));

    return row?.count ?? 0;
  }

  /**
   * Increment graph version for a project
   */
  async incrementGraphVersion(id: string): Promise<Project | null> {
    const project = await this.findById(id);
    if (!project) return null;

    const [updated] = await this.db
      .update(this.table)
      .set({
        graphVersion: project.graphVersion + 1,
        [projects.updatedAt.name]: sql`now()`,
      })
      .where(eq(projects.id, id))
      .returning();
    return updated || null;
  }
}
