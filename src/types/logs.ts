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
