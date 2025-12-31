import { Injectable, Logger } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { db } from "@/database";
import {
  agents,
  type Agent,
  type CreateAgent,
  type UpdateAgent,
} from "@/database/schema";
import { BaseRepository } from "@axion/database";

/**
 * Repository for Agent entity
 * Handles all database operations for agents
 */
@Injectable()
export class AgentRepository extends BaseRepository<
  typeof agents,
  Agent,
  CreateAgent,
  UpdateAgent
> {
  private readonly logger = new Logger(AgentRepository.name);

  constructor() {
    super(db, agents);
  }

  /**
   * Find agent by server ID
   */
  async findByServerId(serverId: string): Promise<Agent | null> {
    this.logger.debug(`Finding agent for server: ${serverId}`);
    const [agent] = await this.db
      .select()
      .from(agents)
      .where(eq(agents.serverId, serverId))
      .limit(1);
    return agent || null;
  }

  /**
   * Update agent heartbeat
   */
  async updateHeartbeat(id: string): Promise<Agent | null> {
    this.logger.debug(`Updating heartbeat for agent: ${id}`);
    const [updated] = await this.db
      .update(agents)
      .set({
        lastHeartbeat: sql`now()`,
      })
      .where(eq(agents.id, id))
      .returning();
    return updated || null;
  }
}
