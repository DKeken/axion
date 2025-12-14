import { BaseRepository } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, desc, and } from "drizzle-orm";

import { db } from "@/database";
import {
  generationHistory,
  type GenerationHistory,
  type CreateGenerationHistory,
  type UpdateGenerationHistory,
} from "@/database/schema";

@Injectable()
export class GenerationHistoryRepository extends BaseRepository<
  typeof generationHistory,
  GenerationHistory,
  CreateGenerationHistory,
  UpdateGenerationHistory
> {
  constructor() {
    super(db, generationHistory);
  }

  /**
   * Find generation history by project ID
   */
  async findByProjectId(projectId: string): Promise<GenerationHistory[]> {
    return this.db
      .select()
      .from(this.table)
      .where(eq(generationHistory.projectId, projectId))
      .orderBy(desc(generationHistory.createdAt));
  }

  /**
   * Find generation history by project ID and node ID
   */
  async findByProjectAndNode(
    projectId: string,
    nodeId: string
  ): Promise<GenerationHistory[]> {
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(generationHistory.projectId, projectId),
          eq(generationHistory.nodeId, nodeId)
        )
      )
      .orderBy(desc(generationHistory.createdAt));
  }

  /**
   * Find latest generation for a service
   */
  async findLatestByService(
    projectId: string,
    nodeId: string
  ): Promise<GenerationHistory | null> {
    const [latest] = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(generationHistory.projectId, projectId),
          eq(generationHistory.nodeId, nodeId)
        )
      )
      .orderBy(desc(generationHistory.codeVersion))
      .limit(1);
    return latest || null;
  }
}
