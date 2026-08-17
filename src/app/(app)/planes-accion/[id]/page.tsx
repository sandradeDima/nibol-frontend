import { requirePermission } from "@/lib/server-auth";
import { ActionPlanDetailView } from "@/modules/remediation/action-plan-detail";

export default async function ActionPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("action_plans.view");
  const { id } = await params;
  return (
    <main>
      <ActionPlanDetailView actionPlanId={id} />
    </main>
  );
}
