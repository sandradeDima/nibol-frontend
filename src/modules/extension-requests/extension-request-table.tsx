"use client";

import { ExtensionRequestReviewWorkspace } from "./extension-request-review-workspace";

export function ExtensionRequestTable({
  canApprove,
  canReject,
  canRequest,
  currentUserId,
  isAdmin,
}: {
  canApprove: boolean;
  canReject: boolean;
  canRequest: boolean;
  currentUserId: string;
  isAdmin: boolean;
}) {
  return (
    <ExtensionRequestReviewWorkspace
      canApprove={canApprove}
      canReject={canReject}
      canRequest={canRequest}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
    />
  );
}
