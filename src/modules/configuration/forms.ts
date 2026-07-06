import { z } from "zod";

const optionalTextSchema = z.string().trim().optional().default("");

const uppercaseKeySchema = z
  .string()
  .trim()
  .min(1, "Ingrese una clave.")
  .max(100, "La clave es demasiado larga.")
  .refine((value) => /^[A-Za-z0-9_]+$/.test(value), {
    message: "Use solo letras, números o guiones bajos.",
  });

const lowercaseKeySchema = z
  .string()
  .trim()
  .min(1, "Ingrese una clave.")
  .max(191, "La clave es demasiado larga.")
  .refine((value) => /^[a-z0-9_]+$/.test(value), {
    message: "Use solo minúsculas, números o guiones bajos.",
  });

const optionalPositiveNumberStringSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || /^[0-9]+$/.test(value), {
    message: "Ingrese un número entero válido.",
  });

export const areaFormSchema = z.object({
  active: z.boolean().default(true),
  code: optionalTextSchema.refine(
    (value) => value.length === 0 || /^[A-Za-z0-9_-]+$/.test(value),
    "Use solo letras, números, guiones o guiones bajos.",
  ),
  description: optionalTextSchema,
  managerUserId: z.string().default(""),
  name: z.string().trim().min(2, "Ingrese un nombre válido.").max(191),
});

export const riskLevelFormSchema = z.object({
  active: z.boolean().default(true),
  colorToken: optionalTextSchema,
  defaultDeadlineDays: optionalPositiveNumberStringSchema,
  description: optionalTextSchema,
  key: uppercaseKeySchema,
  name: z.string().trim().min(2, "Ingrese un nombre válido.").max(100),
  severityOrder: z.coerce.number().int().min(1, "Ingrese una prioridad válida.").max(999),
});

export const observationStatusFormSchema = z
  .object({
    active: z.boolean().default(true),
    countsAsOverdue: z.boolean().default(false),
    description: optionalTextSchema,
    isFinal: z.boolean().default(false),
    isInitial: z.boolean().default(false),
    key: uppercaseKeySchema,
    name: z.string().trim().min(2, "Ingrese un nombre válido.").max(100),
    sortOrder: z.coerce.number().int().min(0).max(999),
  })
  .refine((value) => !(value.isInitial && value.isFinal), {
    message: "Un estado no puede ser inicial y final al mismo tiempo.",
    path: ["isFinal"],
  });

export const systemParameterFormSchema = z.object({
  active: z.boolean().default(true),
  description: optionalTextSchema,
  editable: z.boolean().default(true),
  group: z
    .string()
    .trim()
    .min(1, "Ingrese un grupo.")
    .max(100, "El grupo es demasiado largo.")
    .refine((value) => /^[a-z0-9_]+$/.test(value), {
      message: "Use solo minúsculas, números o guiones bajos.",
    }),
  key: lowercaseKeySchema,
  name: z.string().trim().min(2, "Ingrese un nombre válido.").max(191),
  value: z.string().trim().min(1, "Ingrese un valor."),
  valueType: z.enum(["string", "number", "boolean", "json", "date"]),
});

export const catalogFormSchema = z.object({
  active: z.boolean().default(true),
  description: optionalTextSchema,
  key: optionalTextSchema.refine(
    (value) => value.length === 0 || /^[A-Za-z0-9_]+$/.test(value),
    "Use solo letras, números o guiones bajos.",
  ),
  name: z.string().trim().min(2, "Ingrese un nombre válido.").max(191),
  sortOrder: z.coerce.number().int().min(0).max(999),
  type: z.enum([
    "proceso_auditado",
    "tipo_observacion",
    "fuente_hallazgo",
    "categoria_hallazgo",
  ]),
});

export type AreaFormValues = z.infer<typeof areaFormSchema>;
export type RiskLevelFormValues = z.infer<typeof riskLevelFormSchema>;
export type ObservationStatusFormValues = z.infer<typeof observationStatusFormSchema>;
export type SystemParameterFormValues = z.infer<typeof systemParameterFormSchema>;
export type CatalogFormValues = z.infer<typeof catalogFormSchema>;
