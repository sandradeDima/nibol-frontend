"use client";

import { FileText, X } from "lucide-react";
import { useRef } from "react";

const fileKey = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`;

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export function FilePicker({
  accept,
  error,
  files,
  id,
  label = "Escoger archivos",
  multiple = true,
  onChange,
  onRemove,
  required = false,
}: {
  accept?: string;
  error?: string | null;
  files: File[];
  id: string;
  label?: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
  onRemove: (file: File) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <input
        accept={accept}
        aria-label={label}
        aria-hidden="true"
        className="hidden"
        id={id}
        multiple={multiple}
        onChange={(event) => {
          onChange(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
        ref={inputRef}
        required={required && files.length === 0}
        tabIndex={-1}
        type="file"
      />
      <button
        aria-controls={id}
        className="nibol-btn-secondary px-3 py-2 text-xs"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <FileText className="h-3.5 w-3.5" />
        {label}
      </button>
      {files.length ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
            Archivos seleccionados
          </p>
          <ul aria-label="Archivos seleccionados" className="space-y-2">
            {files.map((file) => (
              <li
                className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
                key={fileKey(file)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-stone-500" />
                  <span className="min-w-0 truncate">{file.name}</span>
                  <span className="shrink-0 text-stone-400">
                    {formatSize(file.size)}
                  </span>
                </span>
                <button
                  aria-label={`Quitar archivo ${file.name}`}
                  className="shrink-0 rounded p-1 text-stone-500 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => onRemove(file)}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? (
        <p
          aria-live="polite"
          className="text-xs font-medium text-rose-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
