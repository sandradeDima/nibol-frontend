import { Suspense } from "react";

import { AcceptInvitationForm } from "@/modules/invitations/accept-invitation-form";

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptInvitationForm />
    </Suspense>
  );
}
