import { z } from "zod";

export const userCreateSchema = z.object({
  email: z.email(),
  isActive: z.boolean(),
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
  roleIds: z.array(z.string()).min(1, "Seleccione al menos un rol."),
});

export const userUpdateSchema = userCreateSchema.omit({
  password: true,
}).extend({
  password: z.string().default(""),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
});

export const profilePasswordSchema = z
  .object({
    confirmPassword: z.string().min(8, "Confirme su nueva contrasena."),
    currentPassword: z.string().min(8, "La contrasena actual debe tener al menos 8 caracteres."),
    newPassword: z.string().min(8, "La nueva contrasena debe tener al menos 8 caracteres."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"],
  });

export type ProfilePasswordValues = z.infer<typeof profilePasswordSchema>;
export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
export type UserCreateValues = z.infer<typeof userCreateSchema>;
export type UserUpdateValues = z.infer<typeof userUpdateSchema>;
