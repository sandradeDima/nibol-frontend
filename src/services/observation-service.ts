import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CreateObservationInput,
  ObservationDetail,
  ObservationFormOptions,
  ObservationTableRow,
  PaginatedApiSuccessResponse,
  UpdateObservationInput,
} from "@/types";

export const observationService = {
  async createObservation(input: CreateObservationInput): Promise<ObservationDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ObservationDetail>>(
      "/observations",
      input,
    );

    return response.data.data;
  },

  async deleteObservation(observationId: string) {
    await apiClient.delete(`/observations/${observationId}`);
  },

  async getObservationById(observationId: string): Promise<ObservationDetail> {
    const response = await apiClient.get<ApiSuccessResponse<ObservationDetail>>(
      `/observations/${observationId}`,
    );

    return response.data.data;
  },

  async getObservationOptions(): Promise<ObservationFormOptions> {
    const response = await apiClient.get<ApiSuccessResponse<ObservationFormOptions>>(
      "/config/bootstrap",
    );

    return response.data.data;
  },

  async listObservations(params: string): Promise<{
    data: ObservationTableRow[];
    pagination: PaginatedApiSuccessResponse<ObservationTableRow[]>["pagination"];
  }> {
    const response =
      await apiClient.get<PaginatedApiSuccessResponse<ObservationTableRow[]>>(
        `/observations${params}`,
      );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async updateObservation(
    observationId: string,
    input: UpdateObservationInput,
  ): Promise<ObservationDetail> {
    const response = await apiClient.patch<ApiSuccessResponse<ObservationDetail>>(
      `/observations/${observationId}`,
      input,
    );

    return response.data.data;
  },
};
