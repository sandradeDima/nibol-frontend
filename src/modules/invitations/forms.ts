import { z } from "zod";

export const invitationCreateSchema = z.object({
  email: z.email("Ingrese un correo electronico valido."),
  roleId: z.uuid("Seleccione un rol valido."),
});

export const invitationAcceptSchema = z
  .object({
    confirmPassword: z.string().min(8, "Confirme su contrasena."),
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
    password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"],
  });

export type InvitationAcceptValues = z.infer<typeof invitationAcceptSchema>;
export type InvitationCreateValues = z.infer<typeof invitationCreateSchema>;
