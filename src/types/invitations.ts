export type InvitationStatus = "Accepted" | "Expired" | "Pending" | "Revoked";

export interface InvitationActor {
  id: string;
  name: string;
}

export interface InvitationRole {
  description: string | null;
  id: string;
  name: string;
}

export interface InvitationTableRow {
  acceptedAt: string | null;
  createdAt: string;
  createdBy: InvitationActor;
  email: string;
  expiresAt: string;
  id: string;
  role: InvitationRole;
  status: InvitationStatus;
}

export type InvitationDetails = InvitationTableRow;

export interface CreateInvitationInput {
  email: string;
  roleId: string;
}

export interface InvitationAcceptancePreview {
  email: string;
  expiresAt: string;
  invitedByName: string;
  roleName: string;
}

export interface AcceptInvitationInput {
  name: string;
  password: string;
  token: string;
}

export interface AcceptedInvitationResponse {
  acceptedAt: string;
  email: string;
  roleName: string;
}
