import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CreateExtensionRequestInput,
  ExtensionRequestDetail,
  ExtensionRequestTableRow,
  PaginatedApiSuccessResponse,
  ReviewExtensionRequestInput,
  UpdateExtensionRequestInput,
} from "@/types";

export const extensionRequestService = {
  async auditApprove(
    requestId: string,
    input?: ReviewExtensionRequestInput,
  ): Promise<ExtensionRequestDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ExtensionRequestDetail>>(
      `/extension-requests/${requestId}/audit-approve`,
      input ?? {},
    );

    return response.data.data;
  },

  async auditReject(
    requestId: string,
    input: ReviewExtensionRequestInput,
  ): Promise<ExtensionRequestDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ExtensionRequestDetail>>(
      `/extension-requests/${requestId}/audit-reject`,
      input,
    );

    return response.data.data;
  },

  async cancel(requestId: string): Promise<ExtensionRequestDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ExtensionRequestDetail>>(
      `/extension-requests/${requestId}/cancel`,
    );

    return response.data.data;
  },

  async createForCommitment(
    commitmentId: string,
    input: CreateExtensionRequestInput,
  ): Promise<ExtensionRequestDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ExtensionRequestDetail>>(
      `/commitments/${commitmentId}/extension-requests`,
      input,
    );

    return response.data.data;
  },

  async createForObservation(
    observationId: string,
    input: CreateExtensionRequestInput,
  ): Promise<ExtensionRequestDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ExtensionRequestDetail>>(
      `/observations/${observationId}/extension-requests`,
      input,
    );

    return response.data.data;
  },

  async getById(requestId: string): Promise<ExtensionRequestDetail> {
    const response = await apiClient.get<ApiSuccessResponse<ExtensionRequestDetail>>(
      `/extension-requests/${requestId}`,
    );

    return response.data.data;
  },

  async list(params: string): Promise<{
    data: ExtensionRequestTableRow[];
    pagination: PaginatedApiSuccessResponse<ExtensionRequestTableRow[]>["pagination"];
  }> {
    const response =
      await apiClient.get<PaginatedApiSuccessResponse<ExtensionRequestTableRow[]>>(
        `/extension-requests${params}`,
      );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async managerApprove(
    requestId: string,
    input?: ReviewExtensionRequestInput,
  ): Promise<ExtensionRequestDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ExtensionRequestDetail>>(
      `/extension-requests/${requestId}/manager-approve`,
      input ?? {},
    );

    return response.data.data;
  },

  async managerReject(
    requestId: string,
    input: ReviewExtensionRequestInput,
  ): Promise<ExtensionRequestDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ExtensionRequestDetail>>(
      `/extension-requests/${requestId}/manager-reject`,
      input,
    );

    return response.data.data;
  },

  async sendToAudit(requestId: string): Promise<ExtensionRequestDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ExtensionRequestDetail>>(
      `/extension-requests/${requestId}/send-to-audit`,
    );

    return response.data.data;
  },

  async sendToManager(requestId: string): Promise<ExtensionRequestDetail> {
    const response = await apiClient.post<ApiSuccessResponse<ExtensionRequestDetail>>(
      `/extension-requests/${requestId}/send-to-manager`,
    );

    return response.data.data;
  },

  async update(
    requestId: string,
    input: UpdateExtensionRequestInput,
  ): Promise<ExtensionRequestDetail> {
    const response = await apiClient.patch<ApiSuccessResponse<ExtensionRequestDetail>>(
      `/extension-requests/${requestId}`,
      input,
    );

    return response.data.data;
  },
};
