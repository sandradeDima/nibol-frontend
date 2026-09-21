"use client";

import { ProgressReviewWorkspace } from "./progress-review-workspace";

export function PendingProgressApprovals({
  canApproveProgress,
  canReturnProgress,
}: {
  canApproveProgress: boolean;
  canReturnProgress: boolean;
}) {
  return (
    <ProgressReviewWorkspace
      canApprove={canApproveProgress}
      canReturn={canReturnProgress}
    />
  );
}
