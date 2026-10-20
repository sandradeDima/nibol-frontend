import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { InvitationForm } from "@/modules/invitations/invitation-form";

export default async function NewInvitationPage() {
  await requirePermission("invitations.create");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Invite a un nuevo integrante, asígnele su rol inicial y envíele el acceso seguro desde un solo flujo."
        eyebrow="Invitaciones"
        title="Nueva invitación"
      />

      <InvitationForm />
    </main>
  );
}
