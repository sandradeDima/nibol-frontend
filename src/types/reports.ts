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
  areaResponsibleId?: string[];
  auditReportId?: string[];
  cutoffDate?: string;
  dateFrom?: string;
  dateTo?: string;
  deadlineStatus?: "VIGENTE" | "VENCIDO";
  deadlineStatuses?: Array<"VIGENTE" | "VENCIDO">;
  dueSoon?: boolean;
  dueSoonDays?: number;
  executorId?: string[];
  globalStatus?: "PENDING" | "CLOSED";
  hasEvidence?: boolean;
  hasExtension?: boolean;
  hasPlan?: boolean;
  overdue?: boolean;
  periodField?:
    | "createdAt"
    | "currentDueDate"
    | "originalDueDate"
    | "reportDate";
  progressMax?: number;
  progressMin?: number;
  progressStatus?: "NOT_STARTED" | "STARTED" | "WITH_PROGRESS" | "CONCLUDED";
  processOwnerId?: string[];
  reprogrammed?: boolean;
  responsibleUserId?: string;
  riskLevelId?: string;
  search?: string;
  observationStatusIds?: string[];
  statusId?: string;
}

export interface ReportActionPlanRow {
  actionPlanId: string;
  auditReportId: string;
  area: { id: string; name: string };
  areaResponsible: ObservationUserSummary | null;
  completedAt: string | null;
  createdAt: string;
  deadlineStatus: "VIGENTE" | "VENCIDO";
  description: string;
  effectiveDueDate: string;
  executor: ObservationUserSummary | null;
  href: string;
  observation: {
    code: string;
    id: string;
    status: { isFinal: boolean; key: string; name: string };
    title: string;
  };
  observationDueDate: string;
  observationId: string;
  officialProgress: {
    code: "NI" | "I" | "CA" | "CO";
    key: "NOT_STARTED" | "STARTED" | "WITH_PROGRESS" | "CONCLUDED";
    label: string;
    percent: number;
  };
  originalDueDate: string;
  processOwner: ObservationUserSummary | null;
  progressPercent: number;
  reportedProgressPercent: number | null;
  reprogrammed: boolean;
  riskLevel: {
    colorToken: string | null;
    id: string;
    key: string;
    name: string;
  };
  title: string;
  updatedAt: string;
}

export interface ReportCriticalObservation {
  area: { id: string; name: string };
  deadlineStatus: "VIGENTE" | "VENCIDO";
  dueDate: string;
  href: string;
  id: string;
  progressPercent: number;
  riskLevel: { colorToken: string | null; name: string };
  observationStatus: { key: string; name: string };
  title: string;
}

export interface ReportUpcomingActionPlan {
  actionPlanId: string;
  deadlineStatus: "VIGENTE" | "VENCIDO";
  effectiveDueDate: string;
  executorName: string;
  href: string;
  observationCode: string;
  observationStatus: string;
  progress: { code: "NI" | "I" | "CA" | "CO"; label: string; percent: number };
  title: string;
}

export interface ReportOptions {
  areas: Array<{ id: string; name: string }>;
  areaRelationships: Array<{
    areaId: string;
    areaResponsibleIds: string[];
    executorIds: string[];
    processOwnerIds: string[];
    responsibleExecutorIds: Array<{
      areaResponsibleId: string;
      executorIds: string[];
    }>;
  }>;
  hierarchyRelationships: Array<{
    areaId: string;
    areaResponsibleId: string | null;
    executorId: string | null;
    processOwnerId: string | null;
  }>;
  auditReports: Array<{ id: string; label: string }>;
  areaResponsibles: ObservationUserSummary[];
  executors: ObservationUserSummary[];
  filterCapabilities: {
    area: boolean;
    areaResponsible: boolean;
    auditReport: boolean;
    executor: boolean;
    processOwner: boolean;
  };
  deadlineStatuses: Array<{ key: "VIGENTE" | "VENCIDO"; label: string }>;
  observationStatuses: Array<{
    id: string;
    isFinal: boolean;
    key: string;
    name: string;
  }>;
  processOwners: ObservationUserSummary[];
  progressStatuses: Array<{
    code: "NI" | "I" | "CA" | "CO";
    key: "NOT_STARTED" | "STARTED" | "WITH_PROGRESS" | "CONCLUDED";
    label: string;
    percent: number;
  }>;
  riskLevels: Array<{
    colorToken: string | null;
    id: string;
    key: string;
    name: string;
  }>;
  defaultCutoffDate: string;
}

export interface ReportChartItem {
  colorToken?: string | null;
  href?: string;
  key: string;
  label: string;
  tooltip?: string;
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
    areaDistribution: ReportChartItem[];
    areaResponsibleDistribution: ReportChartItem[];
    currentVsOverdue: ReportChartItem[];
    deadlineDistribution: ReportChartItem[];
    executorDistribution: ReportChartItem[];
    processOwnerDistribution: ReportChartItem[];
    progressDistribution: ReportChartItem[];
    reprogrammedDistribution: ReportChartItem[];
    riskDistribution: ReportChartItem[];
    statusDistribution: ReportChartItem[];
    topOverdueAreas?: ReportChartItem[];
    topResponsibleWorkload?: ReportChartItem[];
    trend: Array<{
      closed: number;
      created: number;
      label: string;
      monthKey: string;
    }>;
  };
  dueSoonDays: number;
  cutoffDate: string;
  generatedAt: string;
  insights: string[];
  operational: {
    criticalOrOverdueObservations: ReportCriticalObservation[];
    upcomingActionPlans: ReportUpcomingActionPlan[];
  };
  rows: ReportActionPlanRow[];
  summary: {
    averageResolutionDays: number;
    conAvance: number;
    concluido: number;
    closed: number;
    compliancePercent: number;
    dueSoon: number;
    iniciado: number;
    inProcess: number;
    noIniciado: number;
    open: number;
    overdue: number;
    predominantRisk: { count: number; key: string; label: string } | null;
    reprogramados: number;
    total: number;
    totalObservations: number;
    pendingObservations: number;
    closedObservations: number;
    vencidos: number;
    vigentes: number;
  };
}

export interface ReportPreviewData {
  charts: ReportDashboardData["charts"];
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
