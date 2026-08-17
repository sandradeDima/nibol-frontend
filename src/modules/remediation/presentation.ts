import type { ActionPlanStatus } from "@/types";

export const getActionPlanStatusLabel = (
  status: ActionPlanStatus | "OVERDUE",
) =>
  ({
    NOT_STARTED: "No iniciado",
    STARTED: "Iniciado",
    WITH_PROGRESS: "Con avance",
    CONCLUDED: "Concluido",
    OVERDUE: "Vencido",
  })[status];
export const getActionPlanStatusClasses = (
  status: ActionPlanStatus | "OVERDUE",
) =>
  status === "CONCLUDED"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : status === "OVERDUE"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : status === "WITH_PROGRESS"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : "border-stone-200 bg-stone-50 text-stone-700";
export const formatRemediationDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-BO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "—";
export const getDeadlineIndicator = (value: string) => {
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
  return {
    days,
    label:
      days < 0
        ? `${Math.abs(days)} días vencido`
        : days === 0
          ? "Vence hoy"
          : `${days} días restantes`,
    tone: days < 0 ? "danger" : days <= 7 ? "warning" : "neutral",
  };
};
