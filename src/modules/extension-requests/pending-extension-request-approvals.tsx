"use client";

import { ExtensionRequestReviewWorkspace } from "./extension-request-review-workspace";

export function PendingExtensionRequestApprovals() {
  return (
    <ExtensionRequestReviewWorkspace
      pendingOnly
    />
  );
}
