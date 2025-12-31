import { Injectable, Logger } from "@nestjs/common";
import { eq, sql, and } from "drizzle-orm";
import { db } from "@/database";
import {
  servers,
  type Server,
  type CreateServer,
  type UpdateServer,
} from "@/database/schema";
import { BaseRepository } from "@axion/database";

/**
 * Repository for Server entity
 * Handles all database operations for servers
 */
@Injectable()
export class ServerRepository extends BaseRepository<
  typeof servers,
  Server,
  CreateServer,
  UpdateServer
> {
  private readonly logger = new Logger(ServerRepository.name);

  constructor() {
    super(db, servers);
  }

  /**
   * Find all servers for a user with optional filtering and pagination
   */
  async findByUserId(
    userId: string,
    limit?: number,
    offset?: number,
    clusterId?: string
  ): Promise<Server[]> {
    this.logger.debug(`Finding servers for user: ${userId}`);

    let query = this.db
      .select()
      .from(servers)
      .where(
        clusterId
          ? and(eq(servers.userId, userId), eq(servers.clusterId, clusterId))
          : eq(servers.userId, userId)
      )
      .$dynamic();

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }

  /**
   * Count servers for a user
   */
  async countByUserId(userId: string): Promise<number> {
    this.logger.debug(`Counting servers for user: ${userId}`);
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(servers)
      .where(eq(servers.userId, userId));
    return Number(result[0]?.count || 0);
  }

  /**
   * Update server heartbeat
   */
  async updateHeartbeat(id: string): Promise<Server | null> {
    this.logger.debug(`Updating heartbeat for server: ${id}`);
    const [updated] = await this.db
      .update(servers)
      .set({
        lastHeartbeat: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(servers.id, id))
      .returning();
    return updated || null;
  }
}
