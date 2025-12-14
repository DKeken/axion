import { BaseRepository } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, and } from "drizzle-orm";

import { db } from "@/database";
import {
  databaseNodes,
  type DatabaseNode,
  type CreateDatabaseNode,
  type UpdateDatabaseNode,
} from "@/database/schema";

@Injectable()
export class DatabaseNodeRepository extends BaseRepository<
  typeof databaseNodes,
  DatabaseNode,
  CreateDatabaseNode,
  UpdateDatabaseNode
> {
  constructor() {
    super(db, databaseNodes);
  }

  async findByProjectId(projectId: string): Promise<DatabaseNode[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.projectId, projectId));
  }

  async findByProjectIdAndNodeId(
    projectId: string,
    nodeId: string
  ): Promise<DatabaseNode | null> {
    const [node] = await this.db
      .select()
      .from(this.table)
      .where(
        and(eq(this.table.projectId, projectId), eq(this.table.nodeId, nodeId))
      )
      .limit(1);
    return node || null;
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
}
