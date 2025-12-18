import { PAGINATION_DEFAULTS, DEPLOYMENT_STATUS_DB } from "@axion/contracts";
import { BaseRepository, applyPagination } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, desc, and, or, sql } from "drizzle-orm";

import { db } from "@/database";
import {
  deployments,
  type Deployment,
  type CreateDeployment,
  type UpdateDeployment,
} from "@/database/schema";

type DeploymentStatusDbValue =
  (typeof DEPLOYMENT_STATUS_DB)[keyof typeof DEPLOYMENT_STATUS_DB];

@Injectable()
export class DeploymentRepository extends BaseRepository<
  typeof deployments,
  Deployment,
  CreateDeployment,
  UpdateDeployment
> {
  constructor() {
    super(db, deployments);
  }

  /**
   * Find deployments by project ID with pagination
   */
  async findByProjectId(
    projectId: string,
    page: number = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT,
    statusFilter?: DeploymentStatusDbValue
  ): Promise<{ deployments: Deployment[]; total: number }> {
    const conditions = statusFilter
      ? and(
          eq(deployments.projectId, projectId),
          eq(deployments.status, statusFilter)
        )
      : eq(deployments.projectId, projectId);

    const allDeployments = await this.db
      .select()
      .from(this.table)
      .where(conditions)
      .orderBy(desc(deployments.createdAt));

    const { items, total } = applyPagination(allDeployments, { page, limit });
    return { deployments: items, total };
  }

  /**
   * Find deployments by server ID
   */
  async findByServerId(serverId: string): Promise<Deployment[]> {
    return this.db
      .select()
      .from(this.table)
      .where(eq(deployments.serverId, serverId))
      .orderBy(desc(deployments.createdAt));
  }

  /**
   * Find deployments by cluster ID
   */
  async findByClusterId(clusterId: string): Promise<Deployment[]> {
    return this.db
      .select()
      .from(this.table)
      .where(eq(deployments.clusterId, clusterId))
      .orderBy(desc(deployments.createdAt));
  }

  /**
   * Find active deployments (pending or in_progress)
   */
  async findActiveDeployments(): Promise<Deployment[]> {
    return this.db
      .select()
      .from(this.table)
      .where(
        or(
          eq(deployments.status, "pending"),
          eq(deployments.status, "in_progress")
        )
      )
      .orderBy(desc(deployments.createdAt));
  }

  async countByProjectId(projectId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(eq(deployments.projectId, projectId));

    return row?.count ?? 0;
  }
}
