import type { DataTableCsvConfig } from "./types";

const normalizeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeCsvValue(item)).join(", ");
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const escapeCsvValue = (value: string): string => {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
};

const downloadFile = (contents: string, fileName: string) => {
  const blob = new Blob([contents], {
    type: "text/csv;charset=utf-8;",
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(objectUrl);
};

const buildCsvRecords = <TRow>(
  rows: TRow[],
  config?: DataTableCsvConfig<TRow>,
): Record<string, unknown>[] => {
  if (config?.columns) {
    const exportColumns = config.columns;

    return rows.map((row) => {
      return Object.fromEntries(
        exportColumns.map((column) => [column.header, column.value(row)]),
      );
    });
  }

  return rows.map((row) => {
    if (config?.mapRow) {
      return config.mapRow(row);
    }

    return row as Record<string, unknown>;
  });
};

/**
 * Downloads the provided table rows as a CSV file using either explicit export
 * columns or a row-to-record mapper.
 */
export const exportRowsToCsv = <TRow>(
  rows: TRow[],
  config?: DataTableCsvConfig<TRow>,
) => {
  if (rows.length === 0) {
    return;
  }

  const records = buildCsvRecords(rows, config);
  const headers = Object.keys(records[0] ?? {});
  const lines = [
    headers.map((header) => escapeCsvValue(header)).join(","),
    ...records.map((record) => {
      return headers
        .map((header) => escapeCsvValue(normalizeCsvValue(record[header])))
        .join(",");
    }),
  ];

  downloadFile(
    lines.join("\n"),
    config?.fileName ?? `export-${new Date().toISOString().slice(0, 10)}.csv`,
  );
};
