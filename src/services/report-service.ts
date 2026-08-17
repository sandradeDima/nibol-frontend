import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  AuditReportData,
  AuditReportOptions,
  AuditReportQuery,
  PaginatedApiSuccessResponse,
  ReportDashboardData,
  ReportFilters,
  ReportObservationRow,
  ReportPreviewData,
  ReportType,
} from "@/types";

const appendValue = (params: URLSearchParams, key: string, value: unknown) => {
  if (value === undefined || value === null || value === "") return;
  params.set(key, String(value));
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

  async getPreview(
    filters: ReportFilters,
    options?: { reportName?: string; type?: ReportType },
  ): Promise<ReportPreviewData> {
    const response = await apiClient.get<ApiSuccessResponse<ReportPreviewData>>(
      `/reports/preview${buildReportQuery(filters, options)}`,
    );
    return response.data.data;
  },

  async listObservations(
    filters: ReportFilters,
    page = 1,
    perPage = 20,
  ): Promise<{
    data: ReportObservationRow[];
    pagination: PaginatedApiSuccessResponse<
      ReportObservationRow[]
    >["pagination"];
  }> {
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<ReportObservationRow[]>
    >(`/reports/observations${buildReportQuery(filters, { page, perPage })}`);
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
