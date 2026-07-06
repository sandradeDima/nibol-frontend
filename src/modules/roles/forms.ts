import { z } from "zod";

export const roleFormSchema = z.object({
  description: z
    .string()
    .trim()
    .max(255, "La descripcion debe tener 255 caracteres o menos.")
    .default(""),
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(191),
  permissionNames: z.array(z.string()).default([]),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
