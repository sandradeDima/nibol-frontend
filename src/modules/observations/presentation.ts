export const formatObservationDate = (
  value: string,
  options?: Intl.DateTimeFormatOptions,
): string => {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeZone: "UTC",
    ...(options ?? {}),
  }).format(new Date(value));
};

const legacyRiskColors: Record<string, string> = {
  critical: "#B42318",
  high: "#D92D20",
  low: "#027A48",
  medium: "#DC6803",
};

export const getRiskLevelColor = (color?: string | null): string => {
  if (!color) return "#78716C";
  if (/^#[0-9A-F]{6}$/i.test(color)) return color;
  return legacyRiskColors[color] ?? "#78716C";
};

export const getRiskLevelClasses = (): string =>
  "border-transparent text-white";

export const getRiskLevelStyle = (color?: string | null) => {
  const backgroundColor = getRiskLevelColor(color);
  const red = Number.parseInt(backgroundColor.slice(1, 3), 16);
  const green = Number.parseInt(backgroundColor.slice(3, 5), 16);
  const blue = Number.parseInt(backgroundColor.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return {
    backgroundColor,
    borderColor: backgroundColor,
    color: luminance > 0.62 ? "#1C1917" : "#FFFBF7",
  };
};

export const getStatusClasses = (statusKey: string): string => {
  switch (statusKey) {
    case "NO_INICIADO":
      return "border-stone-300 bg-stone-100 text-stone-700";
    case "INICIADO":
      return "border-sky-300 bg-sky-50 text-sky-800";
    case "CON_AVANCE":
      return "border-violet-300 bg-violet-50 text-violet-800";
    case "CONCLUIDO":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "VENCIDA":
      return "border-rose-300 bg-rose-50 text-rose-800";
    default:
      return "border-stone-200 bg-stone-100 text-stone-700";
  }
};
