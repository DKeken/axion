/**
 * SSE Event Types
 * Type definitions for Server-Sent Events in Graph Service
 */

export const SSE_EVENT_TYPES = {
  GRAPH_UPDATED: "graph_updated",
  SERVICE_CHANGED: "service_changed",
} as const;

export const SERVICE_CHANGE_EVENT_TYPES = {
  SERVICE_CREATED: "service_created",
  SERVICE_UPDATED: "service_updated",
  SERVICE_DELETED: "service_deleted",
} as const;

export type SseEventType =
  (typeof SSE_EVENT_TYPES)[keyof typeof SSE_EVENT_TYPES];

export type ServiceChangeEventType =
  (typeof SERVICE_CHANGE_EVENT_TYPES)[keyof typeof SERVICE_CHANGE_EVENT_TYPES];

export type GraphUpdatedEventData = {
  graphData: unknown;
};

export type ServiceChangedEventData = {
  event: ServiceChangeEventType;
  serviceId: string;
};

export type ProjectEventData = GraphUpdatedEventData | ServiceChangedEventData;

export type ProjectEvent = {
  type: SseEventType;
  projectId: string;
  data: ProjectEventData;
  timestamp: number;
};

