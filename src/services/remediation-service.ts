import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CommitmentDetail,
  CommitmentPayload,
  ObservationRemediationWorkspace,
  RemediationPlanDetail,
  UpdateCommitmentPayload,
  UpdateRemediationPlanPayload,
} from "@/types";

export const remediationService = {
  async approvePlan(planId: string): Promise<RemediationPlanDetail> {
    const response = await apiClient.post<ApiSuccessResponse<RemediationPlanDetail>>(
      `/remediation-plans/${planId}/approve`,
    );

    return response.data.data;
  },

  async createCommitment(
    planId: string,
    input: CommitmentPayload,
  ): Promise<CommitmentDetail> {
    const response = await apiClient.post<ApiSuccessResponse<CommitmentDetail>>(
      `/remediation-plans/${planId}/commitments`,
      input,
    );

    return response.data.data;
  },

  async deleteCommitment(commitmentId: string) {
    await apiClient.delete(`/commitments/${commitmentId}`);
  },

  async getObservationWorkspace(
    observationId: string,
    areaId?: string,
  ): Promise<ObservationRemediationWorkspace> {
    const response = await apiClient.get<ApiSuccessResponse<ObservationRemediationWorkspace>>(
      areaId
        ? `/observations/${observationId}/remediation-plan?areaId=${encodeURIComponent(areaId)}`
        : `/observations/${observationId}/remediation-plan`,
    );

    return response.data.data;
  },

  async getPlanCommitments(planId: string): Promise<CommitmentDetail[]> {
    const response = await apiClient.get<ApiSuccessResponse<CommitmentDetail[]>>(
      `/remediation-plans/${planId}/commitments`,
    );

    return response.data.data;
  },

  async markCommitmentComplete(commitmentId: string): Promise<CommitmentDetail> {
    const response = await apiClient.post<ApiSuccessResponse<CommitmentDetail>>(
      `/commitments/${commitmentId}/mark-complete`,
    );

    return response.data.data;
  },

  async returnPlan(planId: string, reason: string): Promise<RemediationPlanDetail> {
    const response = await apiClient.post<ApiSuccessResponse<RemediationPlanDetail>>(
      `/remediation-plans/${planId}/return`,
      {
        reason,
      },
    );

    return response.data.data;
  },

  async saveObservationPlan(
    observationId: string,
    input: {
      additionalComments?: string | null;
      areaId: string;
      mitigationText?: string | null;
      ownerUserId?: string | null;
      strategyText: string;
    },
  ): Promise<RemediationPlanDetail> {
    const response = await apiClient.post<ApiSuccessResponse<RemediationPlanDetail>>(
      `/observations/${observationId}/remediation-plan`,
      input,
    );

    return response.data.data;
  },

  async sendCommitmentToAudit(commitmentId: string): Promise<CommitmentDetail> {
    const response = await apiClient.post<ApiSuccessResponse<CommitmentDetail>>(
      `/commitments/${commitmentId}/send-to-audit`,
    );

    return response.data.data;
  },

  async sendPlanToAudit(planId: string): Promise<RemediationPlanDetail> {
    const response = await apiClient.post<ApiSuccessResponse<RemediationPlanDetail>>(
      `/remediation-plans/${planId}/send-to-audit`,
    );

    return response.data.data;
  },

  async updateCommitment(
    commitmentId: string,
    input: UpdateCommitmentPayload,
  ): Promise<CommitmentDetail> {
    const response = await apiClient.patch<ApiSuccessResponse<CommitmentDetail>>(
      `/commitments/${commitmentId}`,
      input,
    );

    return response.data.data;
  },

  async updatePlan(
    planId: string,
    input: UpdateRemediationPlanPayload,
  ): Promise<RemediationPlanDetail> {
    const response = await apiClient.patch<ApiSuccessResponse<RemediationPlanDetail>>(
      `/remediation-plans/${planId}`,
      input,
    );

    return response.data.data;
  },
};

