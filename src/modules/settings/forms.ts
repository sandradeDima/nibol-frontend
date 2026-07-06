import { z } from "zod";

import { DATE_FORMAT_VALUES } from "@/types";

const supportedTimezones = Array.from(
  new Set([
    "UTC",
    ...(((Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    }).supportedValuesOf?.("timeZone")) ?? []),
  ]),
);

export const timezoneOptions = supportedTimezones;

export const settingsFormSchema = z.object({
  appName: z.string().trim().min(1, "App name is required.").max(191),
  dateFormat: z.enum(DATE_FORMAT_VALUES),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
      message: "Enter a valid hex color.",
    }),
  senderEmail: z
    .string()
    .trim()
    .email("Enter a valid sender email address.")
    .max(191),
  senderName: z.string().trim().min(1, "Sender name is required.").max(191),
  supportEmail: z
    .string()
    .trim()
    .email("Enter a valid support email address.")
    .max(191),
  timezone: z
    .string()
    .trim()
    .refine((value) => timezoneOptions.includes(value), {
      message: "Choose a valid IANA timezone.",
    }),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
