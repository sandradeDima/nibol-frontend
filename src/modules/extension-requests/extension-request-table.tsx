"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { extensionRequestService } from "@/services/extension-request-service";

export function ExtensionRequestTable() {
  const query = useQuery({
    queryFn: () => extensionRequestService.list("?perPage=100"),
    queryKey: ["extension-requests", "all"],
  });
  return (
    <section className="nibol-panel overflow-hidden">
      <div className="divide-y divide-stone-200">
        {query.data?.data.map((request) => (
          <Link
            className="grid gap-4 p-5 transition hover:bg-amber-50/40 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center"
            href={`/ampliaciones-plazo/${request.id}`}
            key={request.id}
          >
            <div>
              <p className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
                {request.targetType === "ACTION_PLAN"
                  ? "Plan de acción"
                  : "Observación"}
              </p>
              <h3 className="mt-1 font-semibold">
                {request.actionPlan?.title ??
                  request.observation?.displayCode ??
                  "Solicitud"}
              </h3>
              <p className="mt-1 line-clamp-1 text-sm text-stone-500">
                {request.reason}
              </p>
            </div>
            <div className="text-sm">
              <p className="text-xs text-stone-500">Cambio de fecha</p>
              <p className="mt-1">
                {request.previousDueDate.slice(0, 10)} →{" "}
                <strong>{request.proposedDueDate.slice(0, 10)}</strong>
              </p>
            </div>
            <div>
              <span className="nibol-badge">
                {request.status.replaceAll("_", " ")}
              </span>
              <p className="mt-2 text-xs text-stone-500">
                {request.requestedByUser.name}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400" />
          </Link>
        ))}
      </div>
      {query.isLoading ? (
        <p className="p-8 text-center text-sm text-stone-500">
          Cargando solicitudes…
        </p>
      ) : null}
      {!query.isLoading && !query.data?.data.length ? (
        <p className="p-10 text-center text-sm text-stone-500">
          No hay solicitudes de ampliación.
        </p>
      ) : null}
    </section>
  );
}
