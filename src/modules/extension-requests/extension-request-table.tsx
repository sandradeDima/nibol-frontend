"use client";

import { ExtensionRequestReviewWorkspace } from "./extension-request-review-workspace";

export function ExtensionRequestTable({
  canRequest,
  currentUserId,
  isAdmin,
}: {
  canRequest: boolean;
  currentUserId: string;
  isAdmin: boolean;
}) {
  return (
    <ExtensionRequestReviewWorkspace
      canRequest={canRequest}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
    />
  );
}
