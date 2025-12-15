import { BaseRepository } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, desc, and } from "drizzle-orm";

import { db } from "@/database";
import {
  deploymentHistory,
  type DeploymentHistory,
  type CreateDeploymentHistory,
  type UpdateDeploymentHistory,
} from "@/database/schema";

@Injectable()
export class DeploymentHistoryRepository extends BaseRepository<
  typeof deploymentHistory,
  DeploymentHistory,
  CreateDeploymentHistory,
  UpdateDeploymentHistory
> {
  constructor() {
    super(db, deploymentHistory);
  }

  /**
   * Find history entries by deployment ID
   */
  async findByDeploymentId(deploymentId: string): Promise<DeploymentHistory[]> {
    return this.db
      .select()
      .from(this.table)
      .where(eq(deploymentHistory.deploymentId, deploymentId))
      .orderBy(desc(deploymentHistory.createdAt));
  }

  /**
   * Find the latest history entry for a deployment (for rollback)
   */
  async findLatestByDeploymentId(
    deploymentId: string
  ): Promise<DeploymentHistory | null> {
    const [latest] = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(deploymentHistory.deploymentId, deploymentId),
          eq(deploymentHistory.rolledBack, false)
        )
      )
      .orderBy(desc(deploymentHistory.createdAt))
      .limit(1);
    return latest || null;
  }

  /**
   * Find history entry by version
   */
  async findByVersion(
    deploymentId: string,
    version: string
  ): Promise<DeploymentHistory | null> {
    const [entry] = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(deploymentHistory.deploymentId, deploymentId),
          eq(deploymentHistory.version, version)
        )
      )
      .limit(1);
    return entry || null;
  }
}
