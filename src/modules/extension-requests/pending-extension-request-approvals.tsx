"use client";

import { ExtensionRequestReviewWorkspace } from "./extension-request-review-workspace";

export function PendingExtensionRequestApprovals({
  canApprove,
  canReject,
}: {
  canApprove: boolean;
  canReject: boolean;
}) {
  return (
    <ExtensionRequestReviewWorkspace
      canApprove={canApprove}
      canReject={canReject}
      pendingOnly
    />
  );
}
