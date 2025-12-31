import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { ServerStatus, ServerSchema, type Server } from "@axion/contracts";
import type { Server as DbServer } from "@/database/schema";

/**
 * Server Mapper
 * Handles conversion between database models and Protobuf messages
 */
export class ServerMapper {
  /**
   * Convert database server model to Protobuf Server message
   */
  static toProto(server: DbServer): Server {
    return create(ServerSchema, {
      id: server.id,
      userId: server.userId,
      clusterId: server.clusterId || undefined,
      name: server.name,
      hostname: server.hostname,
      ipAddress: server.ipAddress,
      status: ServerMapper.statusToProto(server.status),
      metadata: server.metadata as Record<string, string>,
      createdAt: timestampFromDate(server.createdAt),
      updatedAt: timestampFromDate(server.updatedAt),
      lastHeartbeat: server.lastHeartbeat
        ? timestampFromDate(server.lastHeartbeat)
        : undefined,
    });
  }

  /**
   * Convert database status string to Protobuf ServerStatus enum
   */
  static statusToProto(status: string): ServerStatus {
    switch (status) {
      case "ONLINE":
        return ServerStatus.ONLINE;
      case "OFFLINE":
        return ServerStatus.OFFLINE;
      case "MAINTENANCE":
        return ServerStatus.MAINTENANCE;
      case "ERROR":
        return ServerStatus.ERROR;
      default:
        return ServerStatus.UNSPECIFIED;
    }
  }

  /**
   * Convert Protobuf ServerStatus enum to database status string
   */
  static statusFromProto(
    status: ServerStatus
  ): "ONLINE" | "OFFLINE" | "MAINTENANCE" | "ERROR" {
    switch (status) {
      case ServerStatus.ONLINE:
        return "ONLINE";
      case ServerStatus.OFFLINE:
        return "OFFLINE";
      case ServerStatus.MAINTENANCE:
        return "MAINTENANCE";
      case ServerStatus.ERROR:
        return "ERROR";
      default:
        return "OFFLINE";
    }
  }
}
