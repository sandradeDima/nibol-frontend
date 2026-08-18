import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { SpecialRequestLauncher } from "@/modules/workflows/special-request-launcher";

export default async function NewSpecialRequestPage() {
  await requirePermission("workflow_instances.start");
  return (
    <main className="space-y-6">
      <PageHeader
        description="Seleccione un flujo publicado, registre el contexto y envíe la solicitud a su primera etapa."
        eyebrow="Control · Solicitudes especiales"
        title="Iniciar solicitud especial"
      />
      <SpecialRequestLauncher />
    </main>
  );
}
