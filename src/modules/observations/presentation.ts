export const formatObservationDate = (
  value: string,
  options?: Intl.DateTimeFormatOptions,
): string => {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    ...(options ?? {}),
  }).format(new Date(value));
};

export const getRiskLevelClasses = (colorToken?: string | null): string => {
  switch (colorToken) {
    case "critical":
      return "border-rose-300 bg-rose-50 text-rose-800";
    case "high":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "medium":
      return "border-sky-300 bg-sky-50 text-sky-800";
    case "low":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    default:
      return "border-stone-200 bg-stone-100 text-stone-700";
  }
};

export const getStatusClasses = (statusKey: string): string => {
  switch (statusKey) {
    case "PENDIENTE":
      return "border-stone-300 bg-stone-100 text-stone-700";
    case "EN_PROCESO":
      return "border-sky-300 bg-sky-50 text-sky-800";
    case "EN_REVISION":
      return "border-violet-300 bg-violet-50 text-violet-800";
    case "CERRADA":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "VENCIDA":
      return "border-rose-300 bg-rose-50 text-rose-800";
    case "RECHAZADA":
      return "border-zinc-300 bg-zinc-200 text-zinc-800";
    default:
      return "border-stone-200 bg-stone-100 text-stone-700";
  }
};
