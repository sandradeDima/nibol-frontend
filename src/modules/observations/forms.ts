import { z } from "zod";

const nullableTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional();

export const observationFormSchema = z.object({
  additionalAreaIds: z.array(z.string()).default([]),
  areaId: z.string().min(1, "Seleccione un area."),
  auditRecommendation: z
    .string()
    .trim()
    .min(1, "La recomendacion es obligatoria.")
    .max(5000, "La recomendacion es demasiado extensa."),
  category: nullableTextSchema,
  code: z
    .string()
    .trim()
    .min(3, "Ingrese un codigo valido.")
    .max(64, "El codigo es demasiado largo."),
  currentStage: nullableTextSchema,
  description: z
    .string()
    .trim()
    .min(1, "La descripcion es obligatoria.")
    .max(10_000, "La descripcion es demasiado extensa."),
  detectedAt: z.string().min(1, "Seleccione la fecha de deteccion."),
  dueDate: z.string().min(1, "Seleccione la fecha limite."),
  observationType: nullableTextSchema,
  process: nullableTextSchema,
  progressPercent: z.coerce
    .number()
    .int()
    .min(0, "El avance no puede ser menor a 0.")
    .max(100, "El avance no puede superar 100."),
  responsibleUserId: z.string().nullable().optional(),
  riskLevelId: z.string().min(1, "Seleccione un nivel de riesgo."),
  source: nullableTextSchema,
  statusId: z.string().min(1, "Seleccione un estado."),
  title: z
    .string()
    .trim()
    .min(3, "Ingrese un titulo valido.")
    .max(191, "El titulo es demasiado largo."),
});

export type ObservationFormValues = z.infer<typeof observationFormSchema>;
