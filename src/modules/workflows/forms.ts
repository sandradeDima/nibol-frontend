import { z } from "zod";

export const workflowCreateFormSchema = z.object({
  description: z
    .string()
    .trim()
    .max(10_000, "La descripción no puede superar los 10.000 caracteres."),
  name: z
    .string()
    .trim()
    .min(3, "Ingrese un nombre de al menos 3 caracteres.")
    .max(191, "El nombre no puede superar los 191 caracteres."),
  processType: z.string().min(1, "Seleccione el proceso relacionado."),
  versionNotes: z
    .string()
    .trim()
    .max(10_000, "Los comentarios no pueden superar los 10.000 caracteres."),
});

export type WorkflowCreateFormValues = z.infer<typeof workflowCreateFormSchema>;

export const workflowMetadataFormSchema = workflowCreateFormSchema.pick({
  description: true,
  name: true,
  processType: true,
});

export type WorkflowMetadataFormValues = z.infer<
  typeof workflowMetadataFormSchema
>;

export const workflowDraftFormSchema = z.object({
  changeDescription: z
    .string()
    .trim()
    .max(10_000, "Los comentarios no pueden superar los 10.000 caracteres."),
  sourceVersionId: z.string().optional(),
});

export type WorkflowDraftFormValues = z.infer<typeof workflowDraftFormSchema>;

export const workflowDuplicateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Ingrese un nombre de al menos 3 caracteres.")
    .max(191, "El nombre no puede superar los 191 caracteres."),
  sourceVersionId: z.string().min(1, "Seleccione la versión origen."),
  versionNotes: z
    .string()
    .trim()
    .max(10_000, "Los comentarios no pueden superar los 10.000 caracteres."),
});

export type WorkflowDuplicateFormValues = z.infer<
  typeof workflowDuplicateFormSchema
>;

export const specialRequestStartFormSchema = z.object({
  areaId: z.string(),
  description: z
    .string()
    .trim()
    .min(10, "Describa la solicitud con al menos 10 caracteres.")
    .max(10_000, "La descripción no puede superar los 10.000 caracteres."),
  dueDate: z.string(),
  requestType: z
    .string()
    .trim()
    .min(2, "Indique el tipo de solicitud.")
    .max(100, "El tipo no puede superar los 100 caracteres."),
  responsibleUserId: z.string(),
  riskLevel: z.string(),
  title: z
    .string()
    .trim()
    .min(3, "Ingrese un título de al menos 3 caracteres.")
    .max(191, "El título no puede superar los 191 caracteres."),
  workflowDefinitionId: z.string().uuid("Seleccione un flujo publicado."),
});

export type SpecialRequestStartFormValues = z.infer<
  typeof specialRequestStartFormSchema
>;
