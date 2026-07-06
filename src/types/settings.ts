export const DATE_FORMAT_VALUES = [
  "YYYY-MM-DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "DD MMM YYYY",
  "MMMM D, YYYY",
] as const;

export const DATE_FORMAT_OPTIONS = [
  {
    label: "2026-06-19",
    value: DATE_FORMAT_VALUES[0],
  },
  {
    label: "19/06/2026",
    value: DATE_FORMAT_VALUES[1],
  },
  {
    label: "06/19/2026",
    value: DATE_FORMAT_VALUES[2],
  },
  {
    label: "19 Jun 2026",
    value: DATE_FORMAT_VALUES[3],
  },
  {
    label: "June 19, 2026",
    value: DATE_FORMAT_VALUES[4],
  },
] as const;

export type DateFormatOption = (typeof DATE_FORMAT_VALUES)[number];

export interface AppSettings {
  appName: string;
  dateFormat: DateFormatOption;
  logo: string | null;
  primaryColor: string;
  senderEmail: string;
  senderName: string;
  supportEmail: string;
  timezone: string;
  updatedAt: string | null;
}

export interface UpdateSettingsInput {
  appName: string;
  dateFormat: DateFormatOption;
  primaryColor: string;
  senderEmail: string;
  senderName: string;
  supportEmail: string;
  timezone: string;
}
