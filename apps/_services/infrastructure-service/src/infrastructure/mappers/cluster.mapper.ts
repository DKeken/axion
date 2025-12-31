import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { ClusterSchema, type Cluster } from "@axion/contracts";
import type { Cluster as DbCluster } from "@/database/schema";

/**
 * Cluster Mapper
 * Handles conversion between database models and Protobuf messages
 */
export class ClusterMapper {
  /**
   * Convert database cluster model to Protobuf Cluster message
   */
  static toProto(cluster: DbCluster): Cluster {
    return create(ClusterSchema, {
      id: cluster.id,
      userId: cluster.userId,
      name: cluster.name,
      description: cluster.description || undefined,
      metadata: cluster.metadata as Record<string, string>,
      createdAt: timestampFromDate(cluster.createdAt),
      updatedAt: timestampFromDate(cluster.updatedAt),
    });
  }
}
