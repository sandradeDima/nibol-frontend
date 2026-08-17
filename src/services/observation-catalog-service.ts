import { apiClient } from "@/services/api-client";
import type { ApiSuccessResponse, PaginatedApiSuccessResponse } from "@/types";

export type CatalogEntry = {
  createdAt: string;
  description: string | null;
  id: string;
  isActive: boolean;
  name: string;
  updatedAt: string;
};
export type AuditReportEntry = {
  createdAt: string;
  createdByUser: {
    email: string;
    id: string;
    jobTitle: string | null;
    name: string;
  };
  id: string;
  observationCount: number;
  reportDate: string;
  reportNumber: string;
  title: string;
  updatedAt: string;
};

export const observationCatalogService = {
  async list(kind: "risks" | "observation-dictionary") {
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<CatalogEntry[]>
    >(`/${kind}?perPage=100`);
    return response.data.data;
  },
  async create(
    kind: "risks" | "observation-dictionary",
    input: { description?: string | null; isActive?: boolean; name: string },
  ) {
    return (
      await apiClient.post<ApiSuccessResponse<CatalogEntry>>(`/${kind}`, {
        isActive: true,
        ...input,
      })
    ).data.data;
  },
  async update(
    kind: "risks" | "observation-dictionary",
    id: string,
    input: Partial<{
      description: string | null;
      isActive: boolean;
      name: string;
    }>,
  ) {
    return (
      await apiClient.patch<ApiSuccessResponse<CatalogEntry>>(
        `/${kind}/${id}`,
        input,
      )
    ).data.data;
  },
  async remove(kind: "risks" | "observation-dictionary", id: string) {
    await apiClient.delete(`/${kind}/${id}`);
  },
  async listReports() {
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<AuditReportEntry[]>
    >("/audit-reports?perPage=100");
    return response.data.data;
  },
  async createReport(input: {
    reportDate: string;
    reportNumber: string;
    title: string;
  }) {
    return (
      await apiClient.post<ApiSuccessResponse<AuditReportEntry>>(
        "/audit-reports",
        input,
      )
    ).data.data;
  },
};
