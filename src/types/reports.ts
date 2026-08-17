import type {
  ObservationActionSummary,
  ObservationUserSummary,
} from "./observations";

export type ReportType =
  | "OBSERVATIONS"
  | "ACTION_PLANS"
  | "PROGRESS_EVIDENCE"
  | "EXTENSIONS"
  | "AREA_COMPLIANCE"
  | "RESPONSIBLES"
  | "RISKS";

export interface ReportFilters {
  activeOnly?: boolean;
  areaId?: string;
  dateFrom?: string;
  dateTo?: string;
  dueSoon?: boolean;
  dueSoonDays?: number;
  hasEvidence?: boolean;
  hasExtension?: boolean;
  hasPlan?: boolean;
  overdue?: boolean;
  periodField?: "createdAt" | "currentDueDate";
  progressMax?: number;
  progressMin?: number;
  responsibleUserId?: string;
  riskLevelId?: string;
  search?: string;
  statusId?: string;
}

export interface ReportChartItem {
  colorToken?: string | null;
  href?: string;
  key: string;
  label: string;
  value: number;
}

export interface ReportObservationRow {
  actionSummary?: ObservationActionSummary;
  area: { id: string; name: string };
  code: string;
  createdAt: string;
  dueDate: string;
  effectiveStatus: { key: string; name: string };
  id: string;
  isOverdue: boolean;
  progressPercent: number;
  responsibleUser: ObservationUserSummary | null;
  riskLevel: {
    colorToken: string | null;
    id: string;
    key: string;
    name: string;
  };
  status: { isFinal: boolean; key: string; name: string };
  title: string;
  updatedAt: string;
}

export interface ReportDashboardData {
  areaSummary: Array<{
    area: { id: string; name: string };
    averageResolutionDays: number;
    closed: number;
    compliancePercent: number;
    dueSoon: number;
    href: string;
    inProcess: number;
    open: number;
    overdue: number;
    total: number;
  }>;
  charts: {
    areaPerformance: Array<ReportChartItem & { compliancePercent: number }>;
    currentVsOverdue: ReportChartItem[];
    riskDistribution: ReportChartItem[];
    statusDistribution: ReportChartItem[];
    trend: Array<{
      closed: number;
      created: number;
      label: string;
      monthKey: string;
    }>;
  };
  dueSoonDays: number;
  generatedAt: string;
  insights: string[];
  summary: {
    averageResolutionDays: number;
    closed: number;
    compliancePercent: number;
    dueSoon: number;
    inProcess: number;
    open: number;
    overdue: number;
    predominantRisk: { count: number; key: string; label: string } | null;
    total: number;
  };
}

export interface ReportPreviewData {
  columns: string[];
  filters: Record<string, string | number | boolean | null>;
  generatedAt: string;
  reportName: string;
  reportType: ReportType;
  rows: Array<Record<string, unknown>>;
  summary: ReportDashboardData["summary"];
  total: number;
}

export type AuditReportTemplate =
  | "ACTIVITY_AREA"
  | "ACTIVITY_USER"
  | "APPROVALS"
  | "DEADLINES"
  | "EVIDENCE"
  | "EXTENSIONS"
  | "HISTORY"
  | "INCUMPLIMIENTOS"
  | "WORKFLOW_HISTORY";

export interface AuditReportQuery {
  areaId?: string;
  dateFrom?: string;
  dateTo?: string;
  eventType?: string;
  observationId?: string;
  page?: number;
  perPage?: number;
  process?: string;
  result?: string;
  riskLevelId?: string;
  search?: string;
  status?: string;
  template?: AuditReportTemplate;
  userId?: string;
}

export interface AuditReportData {
  columns: string[];
  generatedAt: string;
  rows: Array<Record<string, unknown>>;
  summary: { overdue?: number; total: number };
  template: AuditReportTemplate;
  timeline?: Array<{
    actor: string;
    area: string;
    date: string;
    description: string;
    result: string;
    title: string;
  }>;
}

export interface AuditReportOptions {
  areas: Array<{ id: string; name: string }>;
  eventTypes: Array<{ key: string; label: string }>;
  observations: Array<{ code: string; id: string; title: string }>;
  users: ObservationUserSummary[];
}
