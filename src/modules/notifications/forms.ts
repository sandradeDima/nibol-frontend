import { z } from "zod";

export const notificationTypeOptions = [
  {
    label: "Informacion",
    value: "info",
  },
  {
    label: "Exito",
    value: "success",
  },
  {
    label: "Alerta",
    value: "warning",
  },
  {
    label: "Error",
    value: "error",
  },
] as const;

export const notificationComposerSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "El mensaje es obligatorio.")
    .max(10_000, "El mensaje es demasiado largo."),
  title: z
    .string()
    .trim()
    .min(1, "El titulo es obligatorio.")
    .max(191, "El titulo es demasiado largo."),
  type: z.enum(["info", "success", "warning", "error"]),
  userIds: z
    .array(z.string().uuid())
    .min(1, "Seleccione al menos un destinatario."),
});

export type NotificationComposerValues = z.infer<
  typeof notificationComposerSchema
>;
