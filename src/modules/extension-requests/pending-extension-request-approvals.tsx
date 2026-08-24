"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { extensionRequestService } from "@/services/extension-request-service";

export function PendingExtensionRequestApprovals({
  status = "SENT_TO_AUDIT",
}: {
  status?: "SENT_TO_MANAGER" | "SENT_TO_AUDIT";
}) {
  const query = useQuery({
    queryFn: () =>
      extensionRequestService.list(`?filter.status=${status}&perPage=100`),
    queryKey: ["extension-requests", "pending", status],
  });
  return (
    <div className="space-y-3">
      {query.data?.data.map((request) => (
        <Link
          className="block rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-amber-300"
          href={`/ampliaciones-plazo/${request.id}`}
          key={request.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
                {request.targetType === "ACTION_PLAN"
                  ? "Plan de acción"
                  : "Observación"}
              </p>
              <h4 className="mt-2 font-semibold">
                {request.targetType === "ACTION_PLAN"
                  ? "Plan de acción"
                  : (request.observation?.displayCode ?? "Solicitud")}
              </h4>
              <p className="mt-1 text-sm text-stone-500">
                {request.observationArea?.area.name ?? "Varias áreas"} ·{" "}
                {request.requestedByUser.name}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {request.proposedDueDate.slice(0, 10)}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                +{request.impactDays} días
              </p>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-700">
            {request.reason}
          </p>
        </Link>
      ))}
      {!query.isLoading && !query.data?.data.length ? (
        <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
          No hay solicitudes pendientes.
        </p>
      ) : null}
    </div>
  );
}
