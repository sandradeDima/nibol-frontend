import { apiClient } from "@/services/api-client";
import type {
  AcceptInvitationInput,
  AcceptedInvitationResponse,
  ApiSuccessResponse,
  CreateInvitationInput,
  InvitationAcceptancePreview,
  InvitationDetails,
} from "@/types";

export const invitationService = {
  async acceptInvitation(
    input: AcceptInvitationInput,
  ): Promise<AcceptedInvitationResponse> {
    const response = await apiClient.post<
      ApiSuccessResponse<AcceptedInvitationResponse>
    >("/invitations/accept", {
      mode: "accept",
      ...input,
    });

    return response.data.data;
  },

  async createInvitation(input: CreateInvitationInput): Promise<InvitationDetails> {
    const response = await apiClient.post<ApiSuccessResponse<InvitationDetails>>(
      "/invitations",
      input,
    );

    return response.data.data;
  },

  async getInvitationById(invitationId: string): Promise<InvitationDetails> {
    const response = await apiClient.get<ApiSuccessResponse<InvitationDetails>>(
      `/invitations/${invitationId}`,
    );

    return response.data.data;
  },

  async previewInvitation(
    token: string,
  ): Promise<InvitationAcceptancePreview> {
    const response = await apiClient.post<
      ApiSuccessResponse<InvitationAcceptancePreview>
    >("/invitations/accept", {
      mode: "preview",
      token,
    });

    return response.data.data;
  },

  async resendInvitation(invitationId: string): Promise<InvitationDetails> {
    const response = await apiClient.post<ApiSuccessResponse<InvitationDetails>>(
      `/invitations/${invitationId}/resend`,
    );

    return response.data.data;
  },

  async revokeInvitation(invitationId: string): Promise<InvitationDetails> {
    const response = await apiClient.post<ApiSuccessResponse<InvitationDetails>>(
      `/invitations/${invitationId}/revoke`,
    );

    return response.data.data;
  },
};
