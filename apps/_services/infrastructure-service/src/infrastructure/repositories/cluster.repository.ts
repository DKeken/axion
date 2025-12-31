import { Injectable, Logger } from "@nestjs/common";
import { eq, desc } from "drizzle-orm";
import { db } from "@/database";
import {
  clusters,
  type Cluster,
  type CreateCluster,
  type UpdateCluster,
} from "@/database/schema";
import { BaseRepository } from "@axion/database";

@Injectable()
export class ClusterRepository extends BaseRepository<
  typeof clusters,
  Cluster,
  CreateCluster,
  UpdateCluster
> {
  private readonly logger = new Logger(ClusterRepository.name);

  constructor() {
    super(db, clusters);
  }

  async findByUserId(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<Cluster[]> {
    this.logger.debug(`Finding clusters for user: ${userId}`);

    // We can use findPaginated here or raw query if ordering is specific
    // Since findPaginated is protected, and we want specific ordering by createdAt desc:

    let query = this.db
      .select()
      .from(clusters)
      .where(eq(clusters.userId, userId))
      .orderBy(desc(clusters.createdAt))
      .$dynamic();

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }

  async countByUserId(userId: string): Promise<number> {
    this.logger.debug(`Counting clusters for user: ${userId}`);
    const result = await this.db
      .select({ count: clusters.id })
      .from(clusters)
      .where(eq(clusters.userId, userId));
    return result.length;
  }
}
