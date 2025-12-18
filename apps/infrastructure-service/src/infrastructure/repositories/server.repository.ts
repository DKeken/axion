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

  async countByUserId(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(eq(servers.userId, userId));

    return row?.count ?? 0;
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

  /**
   * Update agent ID and optionally status
   */
  async updateAgentId(
    id: string,
    agentId: string | null,
    status?: Server["status"] | null
  ): Promise<Server | null> {
    const updateData: UpdateServer = {
      agentId,
      updatedAt: new Date(),
    };

    if (status !== undefined && status !== null) {
      updateData.status = status;
    }

    const [updated] = await this.db
      .update(this.table)
      .set({
        ...updateData,
        [servers.updatedAt.name]: sql`now()`,
      })
      .where(eq(servers.id, id))
      .returning();
    return updated || null;
  }

  /**
   * Получение зашифрованных SSH данных для ротации ключей
   */
  async listCredentialsForRotation(): Promise<
    Array<{
      id: string;
      encryptedPrivateKey: string | null;
      encryptedPassword: string | null;
    }>
  > {
    return this.db
      .select({
        id: servers.id,
        encryptedPrivateKey: servers.encryptedPrivateKey,
        encryptedPassword: servers.encryptedPassword,
      })
      .from(this.table);
  }

  /**
   * Обновление зашифрованных SSH данных после ротации
   */
  async updateEncryptedCredentials(
    id: string,
    encryptedPrivateKey: string | null,
    encryptedPassword: string | null
  ): Promise<Server | null> {
    const [updated] = await this.db
      .update(this.table)
      .set({
        encryptedPrivateKey,
        encryptedPassword,
        [servers.updatedAt.name]: sql`now()`,
      })
      .where(eq(servers.id, id))
      .returning();

    return updated || null;
  }
}
