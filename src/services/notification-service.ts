import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CreateNotificationInput,
  NotificationListResult,
  AppNotification,
  AutomaticNotificationRule,
  ListNotificationsParams,
  PaginatedApiSuccessResponse,
  ScheduledJobExecution,
} from "@/types";

const buildNotificationSearchParams = (
  params: ListNotificationsParams = {},
): URLSearchParams => {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("perPage", String(params.perPage ?? 10));

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.type) {
    searchParams.set("filter.type", params.type);
  }

  if (params.priority) {
    searchParams.set("filter.priority", params.priority);
  }

  if (params.eventType) {
    searchParams.set("filter.eventType", params.eventType);
  }

  if (params.dateFrom) {
    searchParams.set("filter.dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    searchParams.set("filter.dateTo", params.dateTo);
  }

  if (params.unreadOnly !== undefined) {
    searchParams.set("filter.unreadOnly", String(params.unreadOnly));
  }

  return searchParams;
};

export const notificationService = {
  async createNotification(input: CreateNotificationInput): Promise<AppNotification> {
    const response = await apiClient.post<ApiSuccessResponse<AppNotification>>(
      "/notifications",
      input,
    );

    return response.data.data;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  async listNotifications(
    params: ListNotificationsParams = {},
  ): Promise<NotificationListResult> {
    const searchParams = buildNotificationSearchParams(params);
    const requestUrl = searchParams.toString()
      ? `/notifications?${searchParams.toString()}`
      : "/notifications";

    const response =
      await apiClient.get<PaginatedApiSuccessResponse<AppNotification[]>>(requestUrl);

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async markAllRead(): Promise<{ updatedCount: number }> {
    const response = await apiClient.post<ApiSuccessResponse<{ updatedCount: number }>>(
      "/notifications/read-all",
    );

    return response.data.data;
  },

  async markRead(notificationId: string): Promise<AppNotification> {
    const response = await apiClient.post<ApiSuccessResponse<AppNotification>>(
      `/notifications/${notificationId}/read`,
    );

    return response.data.data;
  },

  async listAutomaticRules(): Promise<AutomaticNotificationRule[]> {
    const response = await apiClient.get<ApiSuccessResponse<AutomaticNotificationRule[]>>(
      "/automatic-jobs/rules",
    );
    return response.data.data;
  },

  async updateAutomaticRule(key: string, value: string): Promise<AutomaticNotificationRule> {
    const response = await apiClient.patch<ApiSuccessResponse<AutomaticNotificationRule>>(
      `/automatic-jobs/rules/${key}`,
      { value },
    );
    return response.data.data;
  },

  async listJobExecutions(params: { page?: number; perPage?: number } = {}) {
    const response = await apiClient.get<PaginatedApiSuccessResponse<ScheduledJobExecution[]>>(
      "/automatic-jobs/executions",
      { params },
    );
    return { data: response.data.data, pagination: response.data.pagination };
  },

  async runDeadlineMonitor(): Promise<unknown> {
    const response = await apiClient.post<ApiSuccessResponse<unknown>>(
      "/automatic-jobs/deadline-monitor/run",
    );
    return response.data.data;
  },
};
