import { z } from "zod";

import { DATE_FORMAT_VALUES } from "@/types";

const supportedTimezones = Array.from(
  new Set([
    "UTC",
    ...((
      Intl as typeof Intl & {
        supportedValuesOf?: (key: string) => string[];
      }
    ).supportedValuesOf?.("timeZone") ?? []),
  ]),
);

export const timezoneOptions = supportedTimezones;

export const settingsFormSchema = z.object({
  appName: z.string().trim().min(1, "El nombre de la aplicación es obligatorio.").max(191),
  dateFormat: z.enum(DATE_FORMAT_VALUES),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
      message: "Ingrese un color hexadecimal válido.",
    }),
  senderEmail: z
    .string()
    .trim()
    .email("Ingrese un correo electrónico de remitente válido.")
    .max(191),
  senderName: z.string().trim().min(1, "El nombre del remitente es obligatorio.").max(191),
  supportEmail: z
    .string()
    .trim()
    .email("Ingrese un correo electrónico de soporte válido.")
    .max(191),
  timezone: z
    .string()
    .trim()
    .refine((value) => timezoneOptions.includes(value), {
      message: "Seleccione una zona horaria IANA válida.",
    }),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
