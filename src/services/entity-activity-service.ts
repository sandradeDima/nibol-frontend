import { apiClient } from "@/services/api-client";
import type { ApiSuccessResponse, EntityActivity, EntityActivityListResult } from "@/types";

export type EntityActivityFilters = {
  activityType?: string;
  actorUserId?: string;
  areaId?: string;
  dateFrom?: string;
  dateTo?: string;
  entityType?: string;
  includeTechnicalDetails?: boolean;
  observationCode?: string;
  origin?: "SYSTEM" | "USER";
  page?: number;
  pageSize?: number;
  role?: string;
  search?: string;
};

const getList = async (path: string, filters: EntityActivityFilters) => {
  const response = await apiClient.get<ApiSuccessResponse<EntityActivity[]>>(path, {
    params: filters,
  });
  return {
    data: response.data.data,
    pagination: response.data.pagination ?? { page: 1, perPage: filters.pageSize ?? 20, total: response.data.data.length },
  } satisfies EntityActivityListResult;
};

export const entityActivityService = {
  list(filters: EntityActivityFilters = {}) {
    return getList("/activity", filters);
  },

  listObservationHistory(observationId: string, filters: EntityActivityFilters = {}) {
    return getList(`/observations/${observationId}/history`, filters);
  },

  async export(filters: EntityActivityFilters = {}) {
    const response = await apiClient.get<Blob>("/activity/export", {
      params: filters,
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "actividad-nibol.csv";
    link.click();
    URL.revokeObjectURL(url);
  },
};
