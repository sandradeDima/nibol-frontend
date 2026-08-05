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
