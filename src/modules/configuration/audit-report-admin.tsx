"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Save, Search, X } from "lucide-react";

import {
  observationCatalogService,
  type AuditReportClassEntry,
  type AuditReportEntry,
} from "@/services/observation-catalog-service";
import { getApiErrorMessage } from "@/utils";

const emptyReport = {
  reportClassId: "",
  reportDate: "",
  reportNumber: "",
  title: "",
};
const emptyClass = { description: "", name: "" };

export function AuditReportAdmin() {
  const queryClient = useQueryClient();
  const [reportForm, setReportForm] = useState(emptyReport);
  const [editingReport, setEditingReport] = useState<AuditReportEntry | null>(
    null,
  );
  const [reportSearch, setReportSearch] = useState("");
  const [classForm, setClassForm] = useState(emptyClass);
  const [editingClass, setEditingClass] =
    useState<AuditReportClassEntry | null>(null);
  const [classSearch, setClassSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reports = useQuery({
    queryFn: () => observationCatalogService.listReports(reportSearch),
    queryKey: ["audit-reports", "admin", reportSearch],
  });
  const classes = useQuery({
    queryFn: () => observationCatalogService.listReportClasses(classSearch),
    queryKey: ["audit-report-classes", classSearch],
  });
  const refreshReports = () =>
    queryClient.invalidateQueries({ queryKey: ["audit-reports"] });
  const refreshClasses = () =>
    queryClient.invalidateQueries({ queryKey: ["audit-report-classes"] });

  const saveReport = useMutation({
    mutationFn: () => {
      const input = {
        ...reportForm,
        reportClassId: reportForm.reportClassId || null,
      };
      return editingReport
        ? observationCatalogService.updateReport(editingReport.id, input)
        : observationCatalogService.createReport(input);
    },
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setReportForm(emptyReport);
      setEditingReport(null);
      setError(null);
      await refreshReports();
    },
  });
  const saveClass = useMutation({
    mutationFn: () =>
      editingClass
        ? observationCatalogService.updateReportClass(editingClass.id, {
            description: classForm.description.trim() || null,
            name: classForm.name.trim(),
          })
        : observationCatalogService.createReportClass({
            description: classForm.description.trim() || null,
            name: classForm.name.trim(),
          }),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setClassForm(emptyClass);
      setEditingClass(null);
      setError(null);
      await Promise.all([refreshClasses(), refreshReports()]);
    },
  });
  const toggleClass = useMutation({
    mutationFn: (entry: AuditReportClassEntry) =>
      observationCatalogService.updateReportClass(entry.id, {
        active: !entry.active,
      }),
    onError: (cause) => setError(getApiErrorMessage(cause)),
    onSuccess: async () => {
      setError(null);
      await refreshClasses();
    },
  });

  return (
    <div className="space-y-6">
      {error ? (
        <p
          aria-live="polite"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <section className="nibol-panel overflow-hidden">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-950">
            Informes registrados
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            La clase es opcional y puede modificarse junto con los demás datos.
          </p>
        </div>
        <form
          className="grid gap-3 border-b border-stone-200 bg-stone-50 p-5 xl:grid-cols-[190px_1fr_180px_220px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            saveReport.mutate();
          }}
        >
          <input
            aria-label="Número de informe"
            className="nibol-field"
            onChange={(event) =>
              setReportForm((current) => ({
                ...current,
                reportNumber: event.target.value,
              }))
            }
            pattern="[A-Za-z0-9-]+"
            placeholder="Número de informe"
            required
            value={reportForm.reportNumber}
          />
          <input
            aria-label="Título del informe"
            className="nibol-field"
            minLength={3}
            onChange={(event) =>
              setReportForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Título del informe"
            required
            value={reportForm.title}
          />
          <input
            aria-label="Fecha del informe"
            className="nibol-field"
            onChange={(event) =>
              setReportForm((current) => ({
                ...current,
                reportDate: event.target.value,
              }))
            }
            required
            type="date"
            value={reportForm.reportDate}
          />
          <select
            aria-label="Clase del informe"
            className="nibol-field"
            onChange={(event) =>
              setReportForm((current) => ({
                ...current,
                reportClassId: event.target.value,
              }))
            }
            value={reportForm.reportClassId}
          >
            <option value="">Sin clase</option>
            {classes.data
              ?.filter(
                (entry) =>
                  entry.active || entry.id === reportForm.reportClassId,
              )
              .map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                  {entry.active ? "" : " (inactiva)"}
                </option>
              ))}
          </select>
          <div className="flex gap-2">
            <button
              className="nibol-btn-primary px-4 py-2 text-sm"
              disabled={saveReport.isPending}
              type="submit"
            >
              {editingReport ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saveReport.isPending
                ? "Guardando…"
                : editingReport
                  ? "Guardar"
                  : "Crear informe"}
            </button>
            {editingReport ? (
              <button
                aria-label="Cancelar edición"
                className="nibol-btn-secondary px-3"
                onClick={() => {
                  setEditingReport(null);
                  setReportForm(emptyReport);
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </form>
        <div className="border-b border-stone-200 p-5">
          <SearchField
            label="Buscar informes"
            onChange={setReportSearch}
            placeholder="Buscar por número o título"
            value={reportSearch}
          />
        </div>
        <div className="divide-y divide-stone-200">
          {reports.data?.map((report) => (
            <div
              className="grid gap-3 p-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
              key={report.id}
            >
              <div>
                <p className="font-semibold">
                  {report.reportNumber} · {report.title}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {report.reportClass?.name ?? "Sin clase"} · Creado por{" "}
                  {report.createdByUser.name}
                </p>
              </div>
              <span className="text-sm">{report.reportDate.slice(0, 10)}</span>
              <span className="nibol-badge">
                {report.observationCount} observaciones
              </span>
              <button
                className="nibol-btn-secondary px-3 py-2 text-xs"
                onClick={() => {
                  setError(null);
                  setEditingReport(report);
                  setReportForm({
                    reportClassId: report.reportClass?.id ?? "",
                    reportDate: report.reportDate.slice(0, 10),
                    reportNumber: report.reportNumber,
                    title: report.title,
                  });
                }}
                type="button"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
            </div>
          ))}
          {!reports.isLoading && reports.data?.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-500">
              No hay informes que coincidan con la búsqueda.
            </p>
          ) : null}
        </div>
      </section>

      <section className="nibol-panel overflow-hidden">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-950">
            Catálogo de clases de informe
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Administre nombre, descripción y estado de cada clase.
          </p>
        </div>
        <form
          className="grid gap-3 border-b border-stone-200 bg-stone-50 p-5 md:grid-cols-[1fr_1.5fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            saveClass.mutate();
          }}
        >
          <input
            aria-label="Nombre de la clase"
            className="nibol-field"
            minLength={2}
            onChange={(event) =>
              setClassForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Nombre de la clase"
            required
            value={classForm.name}
          />
          <input
            aria-label="Descripción de la clase"
            className="nibol-field"
            onChange={(event) =>
              setClassForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Descripción opcional"
            value={classForm.description}
          />
          <div className="flex gap-2">
            <button
              className="nibol-btn-primary px-4 py-2 text-sm"
              disabled={saveClass.isPending}
              type="submit"
            >
              {editingClass ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingClass ? "Guardar clase" : "Agregar clase"}
            </button>
            {editingClass ? (
              <button
                aria-label="Cancelar edición de clase"
                className="nibol-btn-secondary px-3"
                onClick={() => {
                  setEditingClass(null);
                  setClassForm(emptyClass);
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </form>
        <div className="border-b border-stone-200 p-5">
          <SearchField
            label="Buscar clases"
            onChange={setClassSearch}
            placeholder="Buscar por nombre o descripción"
            value={classSearch}
          />
        </div>
        <div className="divide-y divide-stone-200">
          {classes.data?.map((entry) => (
            <div
              className="flex flex-wrap items-center justify-between gap-4 p-5"
              key={entry.id}
            >
              <div>
                <p className="font-semibold">{entry.name}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {entry.description ?? "Sin descripción"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="nibol-badge">
                  {entry.active ? "Activa" : "Inactiva"}
                </span>
                <button
                  className="nibol-btn-secondary px-3 py-2 text-xs"
                  onClick={() => {
                    setEditingClass(entry);
                    setClassForm({
                      description: entry.description ?? "",
                      name: entry.name,
                    });
                  }}
                  type="button"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  className="nibol-btn-secondary px-3 py-2 text-xs"
                  onClick={() => toggleClass.mutate(entry)}
                  type="button"
                >
                  {entry.active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
          {!classes.isLoading && classes.data?.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-500">
              No hay clases que coincidan con la búsqueda.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SearchField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="relative block max-w-xl">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        aria-label={label}
        className="nibol-field pl-10"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </label>
  );
}
