import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CreateObservationCommentInput,
  CreateProgressEvaluationInput,
  EvidenceFileItem,
  ObservationCommentItem,
  PaginatedApiSuccessResponse,
  ProgressEvaluationItem,
  ReviewProgressEvaluationInput,
  UpdateObservationCommentInput,
  UpdateProgressEvaluationInput,
} from "@/types";

export const progressService = {
  async createProgressEvaluation(
    actionPlanId: string,
    input: CreateProgressEvaluationInput,
  ) {
    const response = await apiClient.post<
      ApiSuccessResponse<ProgressEvaluationItem>
    >(`/action-plans/${actionPlanId}/evaluations`, input);
    return response.data.data;
  },
  async getProgressEvaluation(id: string) {
    const response = await apiClient.get<
      ApiSuccessResponse<ProgressEvaluationItem>
    >(`/progress-evaluations/${id}`);
    return response.data.data;
  },
  async listProgressEvaluations(params = "") {
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<ProgressEvaluationItem[]>
    >(`/progress-evaluations${params}`);
    return { data: response.data.data, pagination: response.data.pagination };
  },
  async updateProgressEvaluation(
    id: string,
    input: UpdateProgressEvaluationInput,
  ) {
    const response = await apiClient.patch<
      ApiSuccessResponse<ProgressEvaluationItem>
    >(`/progress-evaluations/${id}`, input);
    return response.data.data;
  },
  async submitProgressEvaluation(id: string) {
    const response = await apiClient.post<
      ApiSuccessResponse<ProgressEvaluationItem>
    >(`/progress-evaluations/${id}/submit`);
    return response.data.data;
  },
  async reviewProgressEvaluation(
    id: string,
    action: "approve" | "return" | "reject",
    input: ReviewProgressEvaluationInput = {},
  ) {
    const response = await apiClient.post<
      ApiSuccessResponse<ProgressEvaluationItem>
    >(`/progress-evaluations/${id}/${action}`, input);
    return response.data.data;
  },
  async uploadEvidence(
    path: string,
    files: File[],
    context: EvidenceFileItem["context"],
    description = "",
  ) {
    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    body.append("context", context);
    body.append("description", description);
    const response = await apiClient.post<
      ApiSuccessResponse<EvidenceFileItem[]>
    >(path, body);
    return response.data.data;
  },
  async uploadObservationEvidence(
    observationId: string,
    files: File[],
    description = "",
  ) {
    return this.uploadEvidence(
      `/observations/${observationId}/evidence`,
      files,
      "FINDING",
      description,
    );
  },
  async downloadEvidence(file: { downloadPath: string; originalName: string }) {
    const response = await apiClient.get<Blob>(file.downloadPath, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.originalName;
    anchor.click();
    URL.revokeObjectURL(url);
  },
  async getObservationEvidence(observationId: string) {
    const response = await apiClient.get<
      ApiSuccessResponse<EvidenceFileItem[]>
    >(`/observations/${observationId}/evidence`);
    return response.data.data;
  },
  async deleteEvidence(id: string) {
    await apiClient.delete(`/evidences/${id}`);
  },
  async getComments(observationId: string) {
    const response = await apiClient.get<
      ApiSuccessResponse<ObservationCommentItem[]>
    >(`/observations/${observationId}/comments`);
    return response.data.data;
  },
  async createComment(
    observationId: string,
    input: CreateObservationCommentInput,
  ) {
    const response = await apiClient.post<
      ApiSuccessResponse<ObservationCommentItem>
    >(`/observations/${observationId}/comments`, input);
    return response.data.data;
  },
  async updateComment(id: string, input: UpdateObservationCommentInput) {
    const response = await apiClient.patch<
      ApiSuccessResponse<ObservationCommentItem>
    >(`/comments/${id}`, input);
    return response.data.data;
  },
  async deleteComment(id: string) {
    await apiClient.delete(`/comments/${id}`);
  },
};
