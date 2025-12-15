/**
 * Status mapping utilities
 * Maps between database enum values and Protobuf ServiceStatus enum
 */

import { SERVICE_STATUS_DB, SERVER_STATUS_DB } from "../constants";
import { ServiceStatus, ServerStatus } from "../../generated/common/common";

/**
 * Maps database enum value (lowercase string) to Protobuf ServiceStatus enum
 *
 * This is a common utility used across microservices to convert database
 * status values to Protobuf enum values.
 */
export function mapServiceStatus(status: string): ServiceStatus {
  const mapping: Record<string, ServiceStatus> = {
    [SERVICE_STATUS_DB.PENDING]: ServiceStatus.SERVICE_STATUS_PENDING,
    [SERVICE_STATUS_DB.GENERATING]: ServiceStatus.SERVICE_STATUS_GENERATING,
    [SERVICE_STATUS_DB.VALIDATED]: ServiceStatus.SERVICE_STATUS_VALIDATED,
    [SERVICE_STATUS_DB.ERROR]: ServiceStatus.SERVICE_STATUS_ERROR,
    [SERVICE_STATUS_DB.DEPLOYED]: ServiceStatus.SERVICE_STATUS_DEPLOYED,
    [SERVICE_STATUS_DB.DELETED]: ServiceStatus.SERVICE_STATUS_DELETED,
  };
  return mapping[status] || ServiceStatus.SERVICE_STATUS_UNSPECIFIED;
}

/**
 * Maps Protobuf ServiceStatus enum to database enum value (lowercase string)
 *
 * This is a common utility used across microservices to convert Protobuf
 * enum values to database status values.
 */
export function serviceStatusToDbString(
  status: ServiceStatus
):
  | typeof SERVICE_STATUS_DB.PENDING
  | typeof SERVICE_STATUS_DB.GENERATING
  | typeof SERVICE_STATUS_DB.VALIDATED
  | typeof SERVICE_STATUS_DB.ERROR
  | typeof SERVICE_STATUS_DB.DEPLOYED
  | typeof SERVICE_STATUS_DB.DELETED {
  const mapping: Partial<Record<ServiceStatus, string>> = {
    [ServiceStatus.SERVICE_STATUS_UNSPECIFIED]: SERVICE_STATUS_DB.PENDING,
    [ServiceStatus.SERVICE_STATUS_PENDING]: SERVICE_STATUS_DB.PENDING,
    [ServiceStatus.SERVICE_STATUS_GENERATING]: SERVICE_STATUS_DB.GENERATING,
    [ServiceStatus.SERVICE_STATUS_VALIDATED]: SERVICE_STATUS_DB.VALIDATED,
    [ServiceStatus.SERVICE_STATUS_ERROR]: SERVICE_STATUS_DB.ERROR,
    [ServiceStatus.SERVICE_STATUS_DEPLOYED]: SERVICE_STATUS_DB.DEPLOYED,
    [ServiceStatus.SERVICE_STATUS_DELETED]: SERVICE_STATUS_DB.DELETED,
  };
  return (mapping[status] || SERVICE_STATUS_DB.PENDING) as
    | typeof SERVICE_STATUS_DB.PENDING
    | typeof SERVICE_STATUS_DB.GENERATING
    | typeof SERVICE_STATUS_DB.VALIDATED
    | typeof SERVICE_STATUS_DB.ERROR
    | typeof SERVICE_STATUS_DB.DEPLOYED
    | typeof SERVICE_STATUS_DB.DELETED;
}

/**
 * Maps database enum value (lowercase string) to Protobuf ServerStatus enum
 *
 * This is a common utility used across microservices to convert database
 * status values to Protobuf enum values.
 */
export function mapServerStatus(status: string): ServerStatus {
  const mapping: Record<string, ServerStatus> = {
    [SERVER_STATUS_DB.UNSPECIFIED]: ServerStatus.SERVER_STATUS_UNSPECIFIED,
    [SERVER_STATUS_DB.CONNECTED]: ServerStatus.SERVER_STATUS_CONNECTED,
    [SERVER_STATUS_DB.DISCONNECTED]: ServerStatus.SERVER_STATUS_DISCONNECTED,
    [SERVER_STATUS_DB.ERROR]: ServerStatus.SERVER_STATUS_ERROR,
    [SERVER_STATUS_DB.PENDING]: ServerStatus.SERVER_STATUS_PENDING,
    [SERVER_STATUS_DB.INSTALLING]: ServerStatus.SERVER_STATUS_INSTALLING,
  };
  return mapping[status] || ServerStatus.SERVER_STATUS_UNSPECIFIED;
}

/**
 * Maps Protobuf ServerStatus enum to database enum value (lowercase string)
 *
 * This is a common utility used across microservices to convert Protobuf
 * enum values to database status values.
 */
export function serverStatusToDbString(
  status: ServerStatus
):
  | typeof SERVER_STATUS_DB.UNSPECIFIED
  | typeof SERVER_STATUS_DB.CONNECTED
  | typeof SERVER_STATUS_DB.DISCONNECTED
  | typeof SERVER_STATUS_DB.ERROR
  | typeof SERVER_STATUS_DB.PENDING
  | typeof SERVER_STATUS_DB.INSTALLING {
  const mapping: Partial<Record<ServerStatus, string>> = {
    [ServerStatus.SERVER_STATUS_UNSPECIFIED]: SERVER_STATUS_DB.UNSPECIFIED,
    [ServerStatus.SERVER_STATUS_CONNECTED]: SERVER_STATUS_DB.CONNECTED,
    [ServerStatus.SERVER_STATUS_DISCONNECTED]: SERVER_STATUS_DB.DISCONNECTED,
    [ServerStatus.SERVER_STATUS_ERROR]: SERVER_STATUS_DB.ERROR,
    [ServerStatus.SERVER_STATUS_PENDING]: SERVER_STATUS_DB.PENDING,
    [ServerStatus.SERVER_STATUS_INSTALLING]: SERVER_STATUS_DB.INSTALLING,
  };
  return (mapping[status] || SERVER_STATUS_DB.PENDING) as
    | typeof SERVER_STATUS_DB.UNSPECIFIED
    | typeof SERVER_STATUS_DB.CONNECTED
    | typeof SERVER_STATUS_DB.DISCONNECTED
    | typeof SERVER_STATUS_DB.ERROR
    | typeof SERVER_STATUS_DB.PENDING
    | typeof SERVER_STATUS_DB.INSTALLING;
}
