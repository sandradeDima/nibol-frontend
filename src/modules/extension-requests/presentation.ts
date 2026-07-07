import type { ExtensionRequestStatus } from "@/types";

export const formatExtensionRequestDate = (
  value: string | null,
  options?: Intl.DateTimeFormatOptions,
): string => {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    ...(options ?? {}),
  }).format(new Date(value));
};

export const getExtensionRequestStatusLabel = (
  status: ExtensionRequestStatus,
): string => {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "SENT_TO_MANAGER":
      return "En revisión de Gerencia";
    case "MANAGER_APPROVED":
      return "Aprobada por Gerencia";
    case "MANAGER_REJECTED":
      return "Rechazada por Gerencia";
    case "SENT_TO_AUDIT":
      return "En revisión de Auditoría";
    case "AUDIT_APPROVED":
      return "Aprobada";
    case "AUDIT_REJECTED":
      return "Rechazada por Auditoría";
    case "CANCELLED":
      return "Cancelada";
  }
};

export const getExtensionRequestStatusClasses = (
  status: ExtensionRequestStatus,
): string => {
  switch (status) {
    case "DRAFT":
      return "border-stone-300 bg-stone-100 text-stone-700";
    case "SENT_TO_MANAGER":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "MANAGER_APPROVED":
      return "border-sky-300 bg-sky-50 text-sky-800";
    case "MANAGER_REJECTED":
      return "border-rose-300 bg-rose-50 text-rose-800";
    case "SENT_TO_AUDIT":
      return "border-violet-300 bg-violet-50 text-violet-800";
    case "AUDIT_APPROVED":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "AUDIT_REJECTED":
      return "border-rose-300 bg-rose-50 text-rose-800";
    case "CANCELLED":
      return "border-zinc-300 bg-zinc-200 text-zinc-800";
  }
};

export const getFlowTone = (state: "done" | "idle" | "pending" | "rejected"): string => {
  switch (state) {
    case "done":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "pending":
      return "border-sky-300 bg-sky-50 text-sky-800";
    case "rejected":
      return "border-rose-300 bg-rose-50 text-rose-800";
    case "idle":
    default:
      return "border-stone-200 bg-stone-100 text-stone-600";
  }
};
