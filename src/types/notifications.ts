import type { PaginationMeta } from "./api";

export type NotificationType = "error" | "info" | "success" | "warning";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface AppNotification {
  createdAt: string;
  entityId: string | null;
  entityType: string | null;
  eventType: string | null;
  id: string;
  isRead: boolean;
  message: string;
  priority: NotificationPriority;
  readAt: string | null;
  targetUrl: string | null;
  title: string;
  type: NotificationType;
}

export interface CreateNotificationInput {
  message: string;
  title: string;
  type: NotificationType;
  priority?: NotificationPriority;
  userId: string;
}

export interface ListNotificationsParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  unreadOnly?: boolean;
}

export interface AutomaticNotificationRule {
  active: boolean;
  defaultValue: string;
  description: string | null;
  editable: boolean;
  group: string;
  id: string | null;
  key: string;
  name: string;
  updatedAt: string | null;
  value: string;
  valueType: string;
}

export interface ScheduledJobExecution {
  createdAt: string;
  detailsJson: unknown;
  emailsSent: number;
  errorMessage: string | null;
  failuresCount: number;
  finishedAt: string | null;
  id: string;
  jobName: string;
  notificationsCreated: number;
  processedCommitments: number;
  processedCount: number;
  processedObservations: number;
  startedAt: string;
  status: "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";
  triggeredBy: "CRON" | "USER" | "SYSTEM";
  triggeredByUserId: string | null;
}

export interface NotificationListResult {
  data: AppNotification[];
  pagination: PaginationMeta;
}
