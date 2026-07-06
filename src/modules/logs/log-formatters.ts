import { format } from "date-fns";

import type { LogJsonValue } from "@/types";

const isLogRecord = (
  value: LogJsonValue | null,
): value is Record<string, LogJsonValue> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const formatPrimitive = (value: LogJsonValue): string => {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatPrimitive(item)).join(", ");
  }

  if (typeof value === "object") {
    return summarizeLogValue(value);
  }

  return String(value);
};

export const formatLogDateTime = (value: string): string => {
  return format(new Date(value), "MMM d, yyyy HH:mm");
};

export const summarizeLogValue = (value: LogJsonValue | null): string => {
  if (value === null) {
    return "None";
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.slice(0, 4).map((item) => formatPrimitive(item)).join(", ")
      : "None";
  }

  if (isLogRecord(value)) {
    if (typeof value.summary === "string" && value.summary.trim().length > 0) {
      return value.summary;
    }

    const entries = Object.entries(value).filter(([, entry]) => entry !== null);

    if (entries.length === 0) {
      return "None";
    }

    return entries
      .slice(0, 4)
      .map(([key, entry]) => `${key}: ${formatPrimitive(entry)}`)
      .join(" • ");
  }

  return String(value);
};
