import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CreateObservationCommentInput,
  CreateProgressUpdateInput,
  EvidenceFileItem,
  ObservationCommentItem,
  ObservationProgressWorkspace,
  PaginatedApiSuccessResponse,
  ProgressUpdateItem,
  ProgressUpdateTableRow,
  ReviewProgressUpdateInput,
  UpdateObservationCommentInput,
  UpdateProgressUpdateInput,
} from "@/types";

const triggerBlobDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  window.URL.revokeObjectURL(url);
};

export const progressService = {
  async approveProgressUpdate(
    progressUpdateId: string,
    input?: ReviewProgressUpdateInput,
  ): Promise<ProgressUpdateItem> {
    const response = await apiClient.post<ApiSuccessResponse<ProgressUpdateItem>>(
      `/progress-updates/${progressUpdateId}/approve`,
      input ?? {},
    );

    return response.data.data;
  },

  async createObservationComment(
    observationId: string,
    input: CreateObservationCommentInput,
  ): Promise<ObservationCommentItem> {
    const response = await apiClient.post<ApiSuccessResponse<ObservationCommentItem>>(
      `/observations/${observationId}/comments`,
      input,
    );

    return response.data.data;
  },

  async createProgressUpdate(
    observationId: string,
    input: CreateProgressUpdateInput,
  ): Promise<ProgressUpdateItem> {
    const response = await apiClient.post<ApiSuccessResponse<ProgressUpdateItem>>(
      `/observations/${observationId}/progress-updates`,
      input,
    );

    return response.data.data;
  },

  async deleteComment(commentId: string) {
    await apiClient.delete(`/comments/${commentId}`);
  },

  async deleteEvidence(evidenceId: string) {
    await apiClient.delete(`/evidences/${evidenceId}`);
  },

  async downloadEvidence(evidence: Pick<EvidenceFileItem, "id" | "originalName">) {
    const response = await apiClient.get<Blob>(`/evidences/${evidence.id}/download`, {
      responseType: "blob",
    });

    triggerBlobDownload(response.data, evidence.originalName);
  },

  async getObservationComments(observationId: string): Promise<ObservationCommentItem[]> {
    const response = await apiClient.get<ApiSuccessResponse<ObservationCommentItem[]>>(
      `/observations/${observationId}/comments`,
    );

    return response.data.data;
  },

  async getObservationEvidence(observationId: string): Promise<EvidenceFileItem[]> {
    const response = await apiClient.get<ApiSuccessResponse<EvidenceFileItem[]>>(
      `/observations/${observationId}/evidences`,
    );

    return response.data.data;
  },

  async getObservationProgressWorkspace(
    observationId: string,
  ): Promise<ObservationProgressWorkspace> {
    const response = await apiClient.get<ApiSuccessResponse<ObservationProgressWorkspace>>(
      `/observations/${observationId}/progress-updates`,
    );

    return response.data.data;
  },

  async listProgressUpdates(params: string): Promise<{
    data: ProgressUpdateTableRow[];
    pagination: PaginatedApiSuccessResponse<ProgressUpdateTableRow[]>["pagination"];
  }> {
    const response =
      await apiClient.get<PaginatedApiSuccessResponse<ProgressUpdateTableRow[]>>(
        `/progress-updates${params}`,
      );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async rejectProgressUpdate(
    progressUpdateId: string,
    input: ReviewProgressUpdateInput,
  ): Promise<ProgressUpdateItem> {
    const response = await apiClient.post<ApiSuccessResponse<ProgressUpdateItem>>(
      `/progress-updates/${progressUpdateId}/reject`,
      input,
    );

    return response.data.data;
  },

  async returnProgressUpdate(
    progressUpdateId: string,
    input: ReviewProgressUpdateInput,
  ): Promise<ProgressUpdateItem> {
    const response = await apiClient.post<ApiSuccessResponse<ProgressUpdateItem>>(
      `/progress-updates/${progressUpdateId}/return`,
      input,
    );

    return response.data.data;
  },

  async sendProgressUpdateToAudit(progressUpdateId: string): Promise<ProgressUpdateItem> {
    const response = await apiClient.post<ApiSuccessResponse<ProgressUpdateItem>>(
      `/progress-updates/${progressUpdateId}/send-to-audit`,
    );

    return response.data.data;
  },

  async updateObservationComment(
    commentId: string,
    input: UpdateObservationCommentInput,
  ): Promise<ObservationCommentItem> {
    const response = await apiClient.patch<ApiSuccessResponse<ObservationCommentItem>>(
      `/comments/${commentId}`,
      input,
    );

    return response.data.data;
  },

  async updateProgressUpdate(
    progressUpdateId: string,
    input: UpdateProgressUpdateInput,
  ): Promise<ProgressUpdateItem> {
    const response = await apiClient.patch<ApiSuccessResponse<ProgressUpdateItem>>(
      `/progress-updates/${progressUpdateId}`,
      input,
    );

    return response.data.data;
  },

  async uploadObservationEvidence(
    observationId: string,
    files: File[],
    description?: string,
  ): Promise<EvidenceFileItem[]> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    if (description) {
      formData.append("description", description);
    }

    const response = await apiClient.post<ApiSuccessResponse<EvidenceFileItem[]>>(
      `/observations/${observationId}/evidences`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  },

  async uploadProgressEvidence(
    progressUpdateId: string,
    files: File[],
    description?: string,
  ): Promise<EvidenceFileItem[]> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    if (description) {
      formData.append("description", description);
    }

    const response = await apiClient.post<ApiSuccessResponse<EvidenceFileItem[]>>(
      `/progress-updates/${progressUpdateId}/evidences`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  },
};
