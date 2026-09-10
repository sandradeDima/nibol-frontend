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

export type DeadlineReminderRole =
  | "AREA_RESPONSIBLE"
  | "EXECUTOR"
  | "PROCESS_OWNER";

export interface DeadlineReminderPolicy {
  cadenceMonths: number;
  cutoffDay: number;
  createdAt?: string;
  enabled: boolean;
  role: DeadlineReminderRole;
  upcomingWindowDays: number;
}

export interface DeadlineReminderPlan {
  actionPlanId: string;
  area: string;
  bucket: "OVERDUE" | "DUE_TODAY" | "UPCOMING";
  deadlineStatus: "VIGENTE" | "VENCIDO";
  description: string;
  effectiveDueDate: string;
  executor?: string;
  observation: string;
  officialProgress: string;
  officialProgressPercent: number;
  plan: string;
  reprogrammed: boolean;
  report: string;
  risk: string;
}

export interface DeadlineReminderRecipient {
  plans: DeadlineReminderPlan[];
  recipient: {
    email: string;
    id: string;
    name: string;
  };
  roles: DeadlineReminderRole[];
  upcomingWindowDays: number;
}

export interface DeadlineReminderSchedule {
  cadenceKey: string;
  lastExecution: {
    finishedAt: string | null;
    id: string;
    periodKey: string | null;
    status: string;
  } | null;
  nextExecution: string | null;
  role: DeadlineReminderRole;
}

export interface DeadlineReminderConfig {
  policies: DeadlineReminderPolicy[];
  roleLabels: Record<DeadlineReminderRole, string>;
  schedules: DeadlineReminderSchedule[];
  timezone: string;
}

export interface DeadlineReminderPreview {
  cutoffDate: string;
  policy: DeadlineReminderPolicy;
  recipients: DeadlineReminderRecipient[];
  timezone: string;
  totals: {
    dueToday: number;
    overdue: number;
    plans: number;
    recipients: number;
    reprogrammed: number;
    upcoming: number;
  };
  willSend: false;
}

export interface DeadlineReminderRunSummary {
  emailsSent: number;
  executionIds: string[];
  failures: Array<{ entityId: string; entityType: string; message: string }>;
  failuresCount: number;
  finishedAt: string;
  jobName: string;
  lockSkipped: boolean;
  notificationsCreated: number;
  plansIncluded: number;
  recipientsEvaluated: number;
  recipientsNotified: number;
  startedAt: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
}

export interface ScheduledJobExecution {
  cadenceKey: string | null;
  createdAt: string;
  dedupeKey: string | null;
  detailsJson: unknown;
  emailsSent: number;
  errorMessage: string | null;
  failuresCount: number;
  finishedAt: string | null;
  id: string;
  jobName: string;
  notificationsCreated: number;
  processedActionPlans: number;
  processedCount: number;
  processedObservations: number;
  periodKey: string | null;
  runType: string | null;
  scheduledFor: string | null;
  startedAt: string;
  status: "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";
  triggeredBy: "CRON" | "USER" | "SYSTEM";
  triggeredByUserId: string | null;
}

export interface NotificationListResult {
  data: AppNotification[];
  pagination: PaginationMeta;
}
