import { z } from "zod";

const optionalText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => value?.trim() || null);

export const observationAreaFormSchema = z.object({
  areaId: z.string().min(1, "Seleccione un área."),
  areaResponsibleUserId: z
    .string()
    .min(1, "Seleccione al responsable del área."),
  processOwnerUserId: z.string().min(1, "Seleccione al dueño del proceso."),
});

export const observationFormSchema = z.object({
  areaAssignments: z
    .array(observationAreaFormSchema)
    .min(1, "Agregue al menos un área involucrada.")
    .refine(
      (rows) => new Set(rows.map((row) => row.areaId)).size === rows.length,
      {
        message: "Cada área puede agregarse una sola vez.",
      },
    ),
  auditRecommendation: z
    .string()
    .trim()
    .min(1, "Ingrese la recomendación de Auditoría.")
    .max(5_000),
  auditReportId: z.string().min(1, "Seleccione un informe."),
  auditorUserId: z.string().min(1, "Seleccione al auditor responsable."),
  category: optionalText,
  currentStage: optionalText,
  description: z.string().trim().min(1, "Describa la observación.").max(10_000),
  mainObservationId: z.string().min(1, "Seleccione la observación principal."),
  observationNumber: z.coerce
    .number()
    .int()
    .positive("Ingrese un número válido."),
  process: optionalText,
  riskIds: z
    .array(z.string())
    .min(1, "Seleccione al menos un riesgo asociado."),
  riskLevelId: z.string().min(1, "Seleccione un nivel de riesgo."),
  source: optionalText,
  title: z.string().trim().min(3, "Ingrese un título válido.").max(191),
});

export type ObservationFormValues = z.infer<typeof observationFormSchema>;
