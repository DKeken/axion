import { PAGINATION_DEFAULTS } from "@axion/contracts";
import { BaseRepository, applyPagination } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, desc, count } from "drizzle-orm";

import { db } from "@/database";
import {
  clusters,
  servers,
  type Cluster,
  type CreateCluster,
  type UpdateCluster,
} from "@/database/schema";

@Injectable()
export class ClusterRepository extends BaseRepository<
  typeof clusters,
  Cluster,
  CreateCluster,
  UpdateCluster
> {
  constructor() {
    super(db, clusters);
  }

  /**
   * Find clusters by user ID with pagination
   */
  async findByUserId(
    userId: string,
    page: number = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT
  ): Promise<{ clusters: Cluster[]; total: number }> {
    const allClusters = await this.db
      .select()
      .from(this.table)
      .where(eq(clusters.userId, userId))
      .orderBy(desc(clusters.createdAt));

    const { items, total } = applyPagination(allClusters, { page, limit });
    return { clusters: items, total };
  }

  /**
   * Get servers count for a cluster
   */
  async getServersCount(clusterId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(servers)
      .where(eq(servers.clusterId, clusterId));
    return result?.count || 0;
  }
}
