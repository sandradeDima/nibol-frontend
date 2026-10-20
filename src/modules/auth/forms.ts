import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingrese un correo electrónico válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Ingrese un correo electrónico válido."),
});

export const resetPasswordSchema = z
  .object({
    confirmPassword: z.string().min(8, "Confirme su nueva contraseña."),
    newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
