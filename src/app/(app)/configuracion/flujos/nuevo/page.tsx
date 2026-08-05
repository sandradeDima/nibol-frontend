import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/server-auth";
import { WorkflowCreateForm } from "@/modules/workflows/workflow-form";

export default async function NewWorkflowPage() {
  await requirePermission("workflows.create");

  return (
    <main className="space-y-6">
      <PageHeader
        description="Registre los metadatos del flujo y deje preparada la primera versión en borrador para la siguiente fase de configuración."
        eyebrow="Configuración · Flujos"
        title="Crear flujo"
      />
      <WorkflowCreateForm />
    </main>
  );
}
