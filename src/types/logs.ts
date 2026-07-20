import type { PaginationMeta } from "./api";

export interface LogUserReference {
  email: string;
  id: string;
  name: string;
}

export type LogJsonValue =
  | boolean
  | number
  | string
  | null
  | LogJsonValue[]
  | {
      [key: string]: LogJsonValue;
    };

export interface ActivityLogTableRow {
  action: string;
  createdAt: string;
  entityId: string | null;
  entityType: string;
  id: string;
  ipAddress: string | null;
  metadata: LogJsonValue | null;
  user: LogUserReference | null;
}

export type AuditAction = "Created" | "Deleted" | "Updated";

export interface AuditLogTableRow {
  action: AuditAction;
  changedBy: LogUserReference | null;
  createdAt: string;
  entityId: string | null;
  entityType: string;
  id: string;
  newValues: LogJsonValue | null;
  oldValues: LogJsonValue | null;
}

export interface EntityActivity {
  action: string;
  activityType: string;
  actor: {
    email: string;
    id: string | null;
    name: string;
    roles: string[];
  } | null;
  actorType: "USER" | "SYSTEM" | "CRON";
  area: { id: string; name: string } | null;
  createdAt: string;
  description: string | null;
  entityId: string | null;
  entityType: string;
  id?: string;
  metadata: LogJsonValue | null;
  newData: LogJsonValue | null;
  observation: { code: string; title: string } | null;
  previousData: LogJsonValue | null;
  relatedAuditLogId: string | null;
  targetUrl: string | null;
  title: string;
  visibility: string;
}

export interface EntityActivityListResult {
  data: EntityActivity[];
  pagination: PaginationMeta;
}
