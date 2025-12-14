import { PAGINATION_DEFAULTS } from "@axion/contracts";
import { BaseRepository, applyPagination } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, desc, and } from "drizzle-orm";

import { db } from "@/database";
import {
  projectGraphVersions,
  type ProjectGraphVersion,
  type CreateProjectGraphVersion,
  type UpdateProjectGraphVersion,
} from "@/database/schema";

@Injectable()
export class GraphRepository extends BaseRepository<
  typeof projectGraphVersions,
  ProjectGraphVersion,
  CreateProjectGraphVersion,
  UpdateProjectGraphVersion
> {
  constructor() {
    super(db, projectGraphVersions);
  }

  async findByProjectId(
    projectId: string,
    page: number = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT
  ): Promise<{ versions: ProjectGraphVersion[]; total: number }> {
    const allVersions = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.projectId, projectId))
      .orderBy(desc(this.table.version));

    const { items, total } = applyPagination(allVersions, { page, limit });
    return { versions: items, total };
  }

  async findByProjectIdAndVersion(
    projectId: string,
    version: number
  ): Promise<ProjectGraphVersion | null> {
    const [graphVersion] = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.projectId, projectId),
          eq(this.table.version, version)
        )
      )
      .limit(1);
    return graphVersion || null;
  }

  async findLatestByProjectId(
    projectId: string
  ): Promise<ProjectGraphVersion | null> {
    const [latest] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.projectId, projectId))
      .orderBy(desc(this.table.version))
      .limit(1);
    return latest || null;
  }
}
