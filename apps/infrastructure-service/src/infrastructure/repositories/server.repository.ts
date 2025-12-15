import { PAGINATION_DEFAULTS } from "@axion/contracts";
import { BaseRepository, applyPagination } from "@axion/database";
import { Injectable } from "@nestjs/common";
import { eq, desc, sql, isNull, and } from "drizzle-orm";

import { db } from "@/database";
import {
  servers,
  type Server,
  type CreateServer,
  type UpdateServer,
} from "@/database/schema";

@Injectable()
export class ServerRepository extends BaseRepository<
  typeof servers,
  Server,
  CreateServer,
  UpdateServer
> {
  constructor() {
    super(db, servers);
  }

  /**
   * Find servers by user ID with pagination
   */
  async findByUserId(
    userId: string,
    page: number = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT
  ): Promise<{ servers: Server[]; total: number }> {
    const allServers = await this.db
      .select()
      .from(this.table)
      .where(eq(servers.userId, userId))
      .orderBy(desc(servers.createdAt));

    const { items, total } = applyPagination(allServers, { page, limit });
    return { servers: items, total };
  }

  /**
   * Find servers by cluster ID with pagination
   */
  async findByClusterId(
    clusterId: string,
    page: number = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT
  ): Promise<{ servers: Server[]; total: number }> {
    const allServers = await this.db
      .select()
      .from(this.table)
      .where(eq(servers.clusterId, clusterId))
      .orderBy(desc(servers.createdAt));

    const { items, total } = applyPagination(allServers, { page, limit });
    return { servers: items, total };
  }

  /**
   * Find servers without cluster (standalone servers)
   */
  async findStandaloneServers(
    userId: string,
    page: number = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT
  ): Promise<{ servers: Server[]; total: number }> {
    const allServers = await this.db
      .select()
      .from(this.table)
      .where(and(eq(servers.userId, userId), isNull(servers.clusterId)))
      .orderBy(desc(servers.createdAt));

    const { items, total } = applyPagination(allServers, { page, limit });
    return { servers: items, total };
  }

  /**
   * Update last connected timestamp
   */
  async updateLastConnected(id: string): Promise<Server | null> {
    const [updated] = await this.db
      .update(this.table)
      .set({
        lastConnectedAt: sql`now()`,
        [servers.updatedAt.name]: sql`now()`,
      })
      .where(eq(servers.id, id))
      .returning();
    return updated || null;
  }

  /**
   * Update server info (OS, CPU, RAM, Docker, etc.)
   */
  async updateServerInfo(
    id: string,
    serverInfo: Server["serverInfo"]
  ): Promise<Server | null> {
    const [updated] = await this.db
      .update(this.table)
      .set({
        serverInfo,
        [servers.updatedAt.name]: sql`now()`,
      })
      .where(eq(servers.id, id))
      .returning();
    return updated || null;
  }
}
