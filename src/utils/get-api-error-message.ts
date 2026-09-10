import axios from "axios";

import type { ApiErrorResponse } from "@/types";

const translateApiMessage = (message: string): string => {
  if (/At least one file is required/i.test(message))
    return "Seleccione al menos un archivo.";
  if (
    /type of evidence file is not allowed|tipo de archivo de evidencia no está permitido/i.test(
      message,
    )
  )
    return "El formato no está permitido. Use PDF, DOC, DOCX, XLS, XLSX, PNG, JPG o JPEG.";
  if (
    /file of evidence exceeds the allowed size|archivo de evidencia supera el tamaño permitido/i.test(
      message,
    )
  )
    return "El archivo supera el tamaño máximo permitido.";
  if (/Evidence context does not match/i.test(message))
    return "El tipo de evidencia seleccionado no coincide con el destino.";
  if (/internal error/i.test(message))
    return "No se pudo cargar el archivo. Intente nuevamente.";
  return message;
};

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response && /network error|timeout/i.test(error.message)) {
      return "No se pudo completar la carga. Revise su conexión e intente nuevamente.";
    }
    return translateApiMessage(
      error.response?.data?.message ?? "No se pudo completar la solicitud.",
    );
  }

  if (error instanceof Error) return translateApiMessage(error.message);

  return "Ocurrió un error inesperado. Intente nuevamente.";
};

export const getUploadErrorMessage = (error: unknown, files: File[]) => {
  const names = files.map((file) => `“${file.name}”`).join(", ");
  const subject =
    files.length === 1 ? "No se pudo cargar" : "No se pudieron cargar";
  return `${subject} ${names || "el archivo"}. ${getApiErrorMessage(error)}`;
};
