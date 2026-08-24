import { requirePermission } from "@/lib/server-auth";
import { ActionPlanDetailView } from "@/modules/remediation/action-plan-detail";

export default async function ActionPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const authorization = await requirePermission("action_plans.view");
  const { id } = await params;
  const query = await searchParams;
  const edit = Array.isArray(query.edit) ? query.edit[0] : query.edit;
  return (
    <main>
      <ActionPlanDetailView
        actionPlanId={id}
        canEdit={authorization.permissions.includes("action_plans.edit")}
        initialEditing={edit === "1"}
      />
    </main>
  );
}
