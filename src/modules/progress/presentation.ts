import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { CommentVisibility, ProgressReviewAction, ProgressUpdateStatus, ProgressUpdateType } from "@/types";

const progressDateFormatter = (value: string, withTime = true) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return format(date, withTime ? "dd MMM yyyy, HH:mm" : "dd MMM yyyy", {
    locale: es,
  });
};

export const formatProgressDate = (value: string | null | undefined, withTime = true) => {
  if (!value) {
    return "Sin registro";
  }

  return progressDateFormatter(value, withTime);
};

export const formatFileSize = (value: string | number) => {
  const size = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(size) || size <= 0) {
    return "0 KB";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const getProgressTypeLabel = (type: ProgressUpdateType) => {
  switch (type) {
    case "ADVANCE":
      return "Avance";
    case "FINALIZATION":
      return "Finalizacion";
    case "CORRECTION":
      return "Correccion";
  }
};

export const getProgressStatusLabel = (status: ProgressUpdateStatus) => {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "SENT_TO_AUDIT":
      return "Enviado a Auditoria";
    case "APPROVED":
      return "Aprobado";
    case "RETURNED":
      return "Devuelto";
    case "REJECTED":
      return "Rechazado";
  }
};

export const getProgressStatusClasses = (status: ProgressUpdateStatus) => {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "RETURNED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "SENT_TO_AUDIT":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "DRAFT":
    default:
      return "border-stone-200 bg-stone-100 text-stone-700";
  }
};

export const getProgressTypeClasses = (type: ProgressUpdateType) => {
  switch (type) {
    case "FINALIZATION":
      return "border-[color:var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]";
    case "CORRECTION":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ADVANCE":
    default:
      return "border-stone-200 bg-white text-stone-700";
  }
};

export const getCommentVisibilityLabel = (visibility: CommentVisibility) => {
  switch (visibility) {
    case "INTERNAL_AUDIT":
      return "Interno Auditoria";
    case "SYSTEM":
      return "Sistema";
    case "AREA_VISIBLE":
    default:
      return "Visible para el area";
  }
};

export const getCommentVisibilityClasses = (visibility: CommentVisibility) => {
  switch (visibility) {
    case "INTERNAL_AUDIT":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "SYSTEM":
      return "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]";
    case "AREA_VISIBLE":
    default:
      return "border-stone-200 bg-white text-stone-700";
  }
};

export const getReviewActionLabel = (action: ProgressReviewAction) => {
  switch (action) {
    case "APPROVED":
      return "Aprobado";
    case "REJECTED":
      return "Rechazado";
    case "RETURNED":
      return "Devuelto";
    case "SENT":
    default:
      return "Enviado";
  }
};
