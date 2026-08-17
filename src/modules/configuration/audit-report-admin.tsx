"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { observationCatalogService } from "@/services/observation-catalog-service";

export function AuditReportAdmin() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    reportDate: "",
    reportNumber: "",
    title: "",
  });
  const query = useQuery({
    queryFn: observationCatalogService.listReports,
    queryKey: ["audit-reports", "admin"],
  });
  const create = useMutation({
    mutationFn: () => observationCatalogService.createReport(form),
    onSuccess: async () => {
      setForm({ reportDate: "", reportNumber: "", title: "" });
      await queryClient.invalidateQueries({ queryKey: ["audit-reports"] });
    },
  });
  return (
    <section className="nibol-panel overflow-hidden">
      <form
        className="grid gap-3 border-b border-stone-200 bg-stone-50 p-5 lg:grid-cols-[220px_1fr_180px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <input
          className="nibol-field"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              reportNumber: event.target.value,
            }))
          }
          pattern="[A-Za-z0-9-]+"
          placeholder="Número de informe"
          required
          value={form.reportNumber}
        />
        <input
          className="nibol-field"
          minLength={3}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          placeholder="Título del informe"
          required
          value={form.title}
        />
        <input
          className="nibol-field"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              reportDate: event.target.value,
            }))
          }
          required
          type="date"
          value={form.reportDate}
        />
        <button className="nibol-btn-primary px-4 py-2 text-sm" type="submit">
          <Plus className="h-4 w-4" />
          Crear informe
        </button>
      </form>
      <div className="divide-y divide-stone-200">
        {query.data?.map((report) => (
          <div
            className="grid gap-3 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"
            key={report.id}
          >
            <div>
              <p className="font-semibold">
                {report.reportNumber} · {report.title}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Creado por {report.createdByUser.name}
              </p>
            </div>
            <span className="text-sm">{report.reportDate.slice(0, 10)}</span>
            <span className="nibol-badge">
              {report.observationCount} observaciones
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
