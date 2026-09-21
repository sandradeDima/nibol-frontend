import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  AuditReportData,
  AuditReportOptions,
  AuditReportQuery,
  PaginatedApiSuccessResponse,
  ReportActionPlanRow,
  ReportDashboardData,
  ReportFilters,
  ReportOptions,
  ReportPreviewData,
  ReportType,
} from "@/types";

const appendValue = (params: URLSearchParams, key: string, value: unknown) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  )
    return;
  params.set(key, String(Array.isArray(value) ? value.join(",") : value));
};

type SearchParamsLike = { get(name: string): string | null };

export const parseReportFilters = (
  searchParams: SearchParamsLike,
): ReportFilters => {
  const filters: Record<string, unknown> = {};
  const read = (key: string) => searchParams.get(`filter.${key}`);
  const stringKeys = [
    "areaId",
    "dateFrom",
    "dateTo",
    "deadlineStatus",
    "globalStatus",
    "progressStatus",
    "responsibleUserId",
    "riskLevelId",
    "search",
    "statusId",
  ];
  stringKeys.forEach((key) => {
    const value = read(key);
    if (value) filters[key] = value;
  });
  const cutoffDate =
    searchParams.get("fechaCorte") ??
    read("cutoffDate") ??
    searchParams.get("filter.fechaCorte");
  if (cutoffDate) filters.cutoffDate = cutoffDate;
  [
    "areaResponsibleId",
    "auditReportId",
    "deadlineStatuses",
    "executorId",
    "observationStatusIds",
    "processOwnerId",
  ].forEach((key) => {
    const value = read(key);
    const values = value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (values?.length) filters[key] = values;
  });
  [
    "dueSoon",
    "activeOnly",
    "hasEvidence",
    "hasExtension",
    "hasPlan",
    "overdue",
    "reprogrammed",
  ].forEach((key) => {
    const value = read(key);
    if (value === "true" || value === "false") filters[key] = value === "true";
  });
  ["dueSoonDays", "progressMin", "progressMax"].forEach((key) => {
    const value = read(key);
    if (value && Number.isFinite(Number(value))) filters[key] = Number(value);
  });
  const periodField = searchParams.get("periodField");
  if (
    periodField === "createdAt" ||
    periodField === "currentDueDate" ||
    periodField === "originalDueDate" ||
    periodField === "reportDate"
  ) {
    filters.periodField = periodField;
  }
  return filters as ReportFilters;
};

export const buildReportQuery = (
  filters: ReportFilters,
  options?: {
    page?: number;
    perPage?: number;
    reportName?: string;
    type?: ReportType;
  },
): string => {
  const params = new URLSearchParams();
  appendValue(params, "page", options?.page ?? 1);
  appendValue(params, "perPage", options?.perPage ?? 20);
  appendValue(params, "reportName", options?.reportName);
  appendValue(params, "type", options?.type);
  appendValue(params, "periodField", filters.periodField ?? "createdAt");
  Object.entries(filters).forEach(([key, value]) => {
    if (key === "periodField") return;
    if (key === "cutoffDate") {
      appendValue(params, "fechaCorte", value);
      return;
    }
    appendValue(params, `filter.${key}`, value);
  });
  return `?${params.toString()}`;
};

const buildAuditQuery = (query: AuditReportQuery): string => {
  const params = new URLSearchParams();
  appendValue(params, "page", query.page ?? 1);
  appendValue(params, "perPage", query.perPage ?? 20);
  appendValue(params, "template", query.template ?? "HISTORY");
  Object.entries(query).forEach(([key, value]) => {
    if (["page", "perPage", "template"].includes(key)) return;
    appendValue(params, `filter.${key}`, value);
  });
  if (query.observationId) params.set("observationId", query.observationId);
  return `?${params.toString()}`;
};

const download = async (path: string): Promise<Blob> => {
  const response = await apiClient.get(path, { responseType: "blob" });
  return response.data as Blob;
};

export const reportService = {
  async downloadAuditReport(
    query: AuditReportQuery,
    format: "excel" | "pdf",
  ): Promise<Blob> {
    return download(
      `/reports/audit/export${buildAuditQuery(query)}&format=${format}`,
    );
  },

  async downloadReport(
    filters: ReportFilters,
    format: "excel" | "pdf",
    options?: { reportName?: string; type?: ReportType },
  ): Promise<Blob> {
    return download(
      `/reports/export${buildReportQuery(filters, { ...options, perPage: 5000 })}&format=${format}`,
    );
  },

  async getAuditOptions(): Promise<AuditReportOptions> {
    const response = await apiClient.get<
      ApiSuccessResponse<AuditReportOptions>
    >("/reports/audit/options");
    return response.data.data;
  },

  async getAuditReport(query: AuditReportQuery): Promise<AuditReportData> {
    const response = await apiClient.get<ApiSuccessResponse<AuditReportData>>(
      `/reports/audit${buildAuditQuery(query)}`,
    );
    return response.data.data;
  },

  async getDashboard(filters: ReportFilters): Promise<ReportDashboardData> {
    const response = await apiClient.get<
      ApiSuccessResponse<ReportDashboardData>
    >(`/reports/dashboard${buildReportQuery(filters)}`);
    return response.data.data;
  },

  async getOptions(): Promise<ReportOptions> {
    const response =
      await apiClient.get<ApiSuccessResponse<ReportOptions>>(
        "/reports/options",
      );
    return response.data.data;
  },

  async getPreview(
    filters: ReportFilters,
    options?: { reportName?: string; type?: ReportType },
  ): Promise<ReportPreviewData> {
    const response = await apiClient.get<ApiSuccessResponse<ReportPreviewData>>(
      `/reports/preview${buildReportQuery(filters, options)}`,
    );
    return response.data.data;
  },

  async listActionPlans(
    filters: ReportFilters,
    page = 1,
    perPage = 20,
  ): Promise<{
    data: ReportActionPlanRow[];
    pagination: PaginatedApiSuccessResponse<
      ReportActionPlanRow[]
    >["pagination"];
  }> {
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<ReportActionPlanRow[]>
    >(`/reports/action-plans${buildReportQuery(filters, { page, perPage })}`);
    return { data: response.data.data, pagination: response.data.pagination };
  },
};

export const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};
