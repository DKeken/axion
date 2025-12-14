import { PAGINATION_DEFAULTS } from "@axion/contracts";
import { BaseRepository, applyPagination } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, and, inArray } from "drizzle-orm";

import { db } from "@/database";
import {
  projectServices,
  type ProjectService,
  type CreateProjectService,
  type UpdateProjectService,
} from "@/database/schema";

@Injectable()
export class ServiceRepository extends BaseRepository<
  typeof projectServices,
  ProjectService,
  CreateProjectService,
  UpdateProjectService
> {
  constructor() {
    super(db, projectServices);
  }

  async findByProjectId(
    projectId: string,
    page: number = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT
  ): Promise<{ services: ProjectService[]; total: number }> {
    const allServices = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.projectId, projectId));

    const { items, total } = applyPagination(allServices, { page, limit });
    return { services: items, total };
  }

  async findByProjectIdAndNodeId(
    projectId: string,
    nodeId: string
  ): Promise<ProjectService | null> {
    const [service] = await this.db
      .select()
      .from(this.table)
      .where(
        and(eq(this.table.projectId, projectId), eq(this.table.nodeId, nodeId))
      )
      .limit(1);
    return service || null;
  }

  async deleteByNodeId(projectId: string, nodeId: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(
        and(eq(this.table.projectId, projectId), eq(this.table.nodeId, nodeId))
      )
      .returning();
    return result.length > 0;
  }

  async deleteByProjectId(projectId: string): Promise<number> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.projectId, projectId))
      .returning();
    return result.length;
  }

  async findByNodeIds(
    projectId: string,
    nodeIds: string[]
  ): Promise<ProjectService[]> {
    if (nodeIds.length === 0) return [];

    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.projectId, projectId),
          inArray(this.table.nodeId, nodeIds)
        )
      );
  }
}
