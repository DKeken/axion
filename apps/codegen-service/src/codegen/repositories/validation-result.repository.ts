import { BaseRepository } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, desc, and } from "drizzle-orm";

import { db } from "@/database";
import {
  validationResults,
  type ValidationResult,
  type CreateValidationResult,
  type UpdateValidationResult,
} from "@/database/schema";

@Injectable()
export class ValidationResultRepository extends BaseRepository<
  typeof validationResults,
  ValidationResult,
  CreateValidationResult,
  UpdateValidationResult
> {
  constructor() {
    super(db, validationResults);
  }

  /**
   * Find validation results by project ID
   */
  async findByProjectId(projectId: string): Promise<ValidationResult[]> {
    return this.db
      .select()
      .from(this.table)
      .where(eq(validationResults.projectId, projectId))
      .orderBy(desc(validationResults.createdAt));
  }

  /**
   * Find validation results by project ID and node ID
   */
  async findByProjectAndNode(
    projectId: string,
    nodeId: string
  ): Promise<ValidationResult[]> {
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(validationResults.projectId, projectId),
          eq(validationResults.nodeId, nodeId)
        )
      )
      .orderBy(desc(validationResults.createdAt));
  }

  /**
   * Find latest validation result for a service
   */
  async findLatestByService(
    projectId: string,
    nodeId: string
  ): Promise<ValidationResult | null> {
    const [latest] = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(validationResults.projectId, projectId),
          eq(validationResults.nodeId, nodeId)
        )
      )
      .orderBy(desc(validationResults.createdAt))
      .limit(1);
    return latest || null;
  }
}
