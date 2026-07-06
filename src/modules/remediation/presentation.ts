import type { CommitmentStatus, RemediationPlanStatus } from "@/types";

export const formatRemediationDate = (
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

export const getRemediationPlanStatusLabel = (status: RemediationPlanStatus): string => {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "SENT_TO_AUDIT":
      return "Enviado a Auditoria";
    case "APPROVED":
      return "Aprobado";
    case "RETURNED":
      return "Devuelto";
    case "CLOSED":
      return "Cerrado";
  }
};

export const getCommitmentStatusLabel = (status: CommitmentStatus): string => {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "IN_PROGRESS":
      return "En progreso";
    case "SENT_TO_AUDIT":
      return "Enviado a Auditoria";
    case "APPROVED":
      return "Aprobado";
    case "RETURNED":
      return "Devuelto";
    case "COMPLETED":
      return "Completado";
    case "OVERDUE":
      return "Vencido";
  }
};

export const getRemediationPlanStatusClasses = (
  status: RemediationPlanStatus,
): string => {
  switch (status) {
    case "DRAFT":
      return "border-stone-300 bg-stone-100 text-stone-700";
    case "SENT_TO_AUDIT":
      return "border-sky-300 bg-sky-50 text-sky-800";
    case "APPROVED":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "RETURNED":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "CLOSED":
      return "border-zinc-300 bg-zinc-200 text-zinc-800";
  }
};

export const getCommitmentStatusClasses = (status: CommitmentStatus): string => {
  switch (status) {
    case "PENDING":
      return "border-stone-300 bg-stone-100 text-stone-700";
    case "IN_PROGRESS":
      return "border-sky-300 bg-sky-50 text-sky-800";
    case "SENT_TO_AUDIT":
      return "border-violet-300 bg-violet-50 text-violet-800";
    case "APPROVED":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "RETURNED":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "COMPLETED":
      return "border-emerald-300 bg-emerald-100 text-emerald-800";
    case "OVERDUE":
      return "border-rose-300 bg-rose-50 text-rose-800";
  }
};

export const getDeadlineIndicator = (value: string | null): {
  label: string;
  tone: string;
} => {
  if (!value) {
    return {
      label: "Sin fecha limite",
      tone: "border-stone-200 bg-stone-100 text-stone-700",
    };
  }

  const dueDate = new Date(value);
  const today = Date.now();
  const diffDays = Math.ceil((dueDate.getTime() - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: "Vencida",
      tone: "border-rose-300 bg-rose-50 text-rose-800",
    };
  }

  if (diffDays <= 7) {
    return {
      label: "Proxima a vencer",
      tone: "border-amber-300 bg-amber-50 text-amber-800",
    };
  }

  return {
    label: "En plazo",
    tone: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };
};

