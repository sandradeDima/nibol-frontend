import type { PaginationMeta } from "./api";

export type NotificationType = "error" | "info" | "success" | "warning";

export interface AppNotification {
  createdAt: string;
  id: string;
  isRead: boolean;
  message: string;
  title: string;
  type: NotificationType;
}

export interface CreateNotificationInput {
  message: string;
  title: string;
  type: NotificationType;
  userId: string;
}

export interface ListNotificationsParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: NotificationType;
  unreadOnly?: boolean;
}

export interface NotificationListResult {
  data: AppNotification[];
  pagination: PaginationMeta;
}
