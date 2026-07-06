import type { CSSProperties, ComponentType } from "react";

import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Gauge,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { SIDEBAR_ITEMS } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { getServerAuthorization, requireAuth } from "@/lib/server-auth";

const trendSeries = [32, 38, 35, 49, 46, 58];
const pendingSeries = [18, 14, 12, 17, 22, 19];
const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];

const complianceAreas = [
  { name: "Logistica y distribucion", progress: 78, total: 45, overdue: 3 },
  { name: "Servicio tecnico", progress: 64, total: 32, overdue: 8 },
  { name: "Ventas maquinaria", progress: 81, total: 28, overdue: 2 },
  { name: "Finanzas y contabilidad", progress: 88, total: 51, overdue: 1 },
] as const;

const recentActivity = [
  {
    detail: "Carlos Ruiz adjunto soporte al inventario para OBS-2024-069.",
    time: "Hace 10 minutos",
    title: "Nueva evidencia subida",
  },
  {
    detail: "Gerencia de Riesgos aprobo el plan para la observacion OBS-2024-178.",
    time: "Hace 2 horas",
    title: "Plan de accion aprobado",
  },
  {
    detail: "Area de TI solicito 15 dias adicionales para OBS-2024-055.",
    time: "Hace 5 horas",
    title: "Solicitud de ampliacion",
  },
] as const;

const riskSegments = [
  { color: "#07142D", label: "Critico", value: 18 },
  { color: "#44526B", label: "Alto", value: 34 },
  { color: "#94A3B8", label: "Medio", value: 28 },
  { color: "#CBD5E1", label: "Bajo", value: 20 },
] as const;

const buildPolyline = (values: number[]): string => {
  const width = 420;
  const height = 220;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 30) - 15;
      return `${x},${y}`;
    })
    .join(" ");
};

const buildAreaPath = (values: number[]): string => {
  const polyline = buildPolyline(values).split(" ");

  return `M0,220 L${polyline.join(" L ")} L420,220 Z`;
};

function DashboardMetric({
  icon: Icon,
  label,
  note,
  value,
}: {
  icon: ComponentType<{
    className?: string;
  }>;
  label: string;
  note: string;
  value: string;
}) {
  return (
    <article className="nibol-panel grid gap-4 px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
          {label}
        </p>
        <div className="flex h-10 w-10 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {value}
        </p>
        <p className="text-sm leading-6 text-[var(--foreground-soft)]">{note}</p>
      </div>
    </article>
  );
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const authorization = await getServerAuthorization();

  if (!authorization) {
    return null;
  }

  const enabledModules = SIDEBAR_ITEMS.filter((item) => {
    return !item.permission || hasPermission(authorization.permissions, item.permission);
  }).length;

  const donutStyle = {
    background: `conic-gradient(${riskSegments
      .reduce<{ color: string; end: number; start: number }[]>((accumulator, segment) => {
        const start = accumulator.at(-1)?.end ?? 0;
        const end = start + segment.value;
        accumulator.push({
          color: segment.color,
          end,
          start,
        });
        return accumulator;
      }, [])
      .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
      .join(", ")})`,
  } satisfies CSSProperties;

  const metrics = [
    {
      icon: ClipboardList,
      label: "Modulos activos",
      note: "Secciones habilitadas segun permisos del usuario.",
      value: String(enabledModules).padStart(2, "0"),
    },
    {
      icon: ShieldCheck,
      label: "Permisos activos",
      note: "Controles disponibles dentro del panel corporativo.",
      value: String(authorization.permissions.length).padStart(2, "0"),
    },
    {
      icon: Gauge,
      label: "Roles asignados",
      note: "Perfiles vigentes para la sesion actual.",
      value: String(authorization.roles.length).padStart(2, "0"),
    },
    {
      icon: CheckCircle2,
      label: "Cumplimiento",
      note: authorization.isAdmin
        ? "Nivel de control estimado para acceso administrador."
        : "Nivel de control estimado para acceso restringido.",
      value: authorization.isAdmin ? "92%" : "84%",
    },
  ] as const;

  return (
    <main className="space-y-6">
      <PageHeader
        description={`Bienvenido ${session.user.name}. Este panel resume el estado del entorno interno de NIBOL con una estructura visual alineada al dashboard corporativo solicitado.`}
        eyebrow="Panel ejecutivo"
        title="Panel de control"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardMetric key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="nibol-panel overflow-hidden px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="nibol-eyebrow">Estado de planes de accion</p>
              <h2 className="font-display mt-2 text-3xl font-bold uppercase leading-none tracking-[-0.03em] text-[var(--foreground)]">
                Seguimiento mensual
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <span className="border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)]">
                Mensual
              </span>
              <span className="border border-[var(--border)] bg-white px-3 py-2 text-[var(--muted)]">
                Anual
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="flex flex-wrap items-center gap-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-6 bg-[var(--primary)]" />
                Completados
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-6 bg-slate-300" />
                Pendientes
              </span>
            </div>

            <div className="overflow-hidden border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-5">
              <svg
                aria-hidden="true"
                className="h-[16rem] w-full"
                preserveAspectRatio="none"
                viewBox="0 0 420 220"
              >
                <path d={buildAreaPath(trendSeries)} fill="rgba(7,20,45,0.08)" />
                <path d={buildAreaPath(pendingSeries)} fill="rgba(148,163,184,0.22)" />
                <polyline
                  fill="none"
                  points={buildPolyline(trendSeries)}
                  stroke="#07142D"
                  strokeWidth="3"
                />
                <polyline
                  fill="none"
                  points={buildPolyline(pendingSeries)}
                  stroke="#94A3B8"
                  strokeWidth="3"
                />
              </svg>

              <div className="mt-4 grid grid-cols-6 gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {monthLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="nibol-panel px-6 py-6">
          <p className="nibol-eyebrow">Riesgo de observaciones</p>
          <h2 className="font-display mt-2 text-3xl font-bold uppercase leading-none tracking-[-0.03em] text-[var(--foreground)]">
            Distribucion actual
          </h2>

          <div className="mt-8 flex flex-col items-center gap-8">
            <div
              className="relative h-52 w-52 rounded-full"
              style={donutStyle}
            >
              <div className="absolute inset-[22%] flex items-center justify-center rounded-full bg-white text-center shadow-[var(--shadow-panel)]">
                <div>
                  <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Global
                  </p>
                  <p className="mt-2 text-4xl font-semibold text-[var(--foreground)]">100%</p>
                </div>
              </div>
            </div>

            <div className="grid w-full gap-3">
              {riskSegments.map((segment) => (
                <div key={segment.label} className="flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                  <span className="inline-flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
                    <span className="h-3 w-3" style={{ backgroundColor: segment.color }} />
                    {segment.label}
                  </span>
                  <span className="text-sm font-semibold text-[var(--foreground-soft)]">
                    {segment.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="nibol-panel px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="nibol-eyebrow">Cumplimiento por area</p>
              <h2 className="font-display mt-2 text-3xl font-bold uppercase leading-none tracking-[-0.03em] text-[var(--foreground)]">
                Estado operativo
              </h2>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Ver todos
            </span>
          </div>

          <div className="mt-6 overflow-hidden border border-[var(--border)]">
            <div className="grid grid-cols-[minmax(0,1.4fr)_90px_90px_160px] gap-4 border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              <span>Area / gerencia</span>
              <span>Total</span>
              <span>Vencidas</span>
              <span>Progreso</span>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {complianceAreas.map((area) => (
                <div
                  key={area.name}
                  className="grid grid-cols-[minmax(0,1.4fr)_90px_90px_160px] gap-4 px-4 py-4 text-sm text-[var(--foreground-soft)]"
                >
                  <span className="font-medium text-[var(--foreground)]">{area.name}</span>
                  <span>{area.total}</span>
                  <span>{area.overdue}</span>
                  <span className="flex items-center gap-3">
                    <span className="h-3 flex-1 bg-[var(--surface-muted)]">
                      <span
                        className="block h-full bg-[var(--primary)]"
                        style={{ width: `${area.progress}%` }}
                      />
                    </span>
                    <span className="w-10 text-right font-semibold text-[var(--foreground)]">
                      {area.progress}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="nibol-panel px-6 py-6">
          <p className="nibol-eyebrow">Actividad reciente</p>
          <h2 className="font-display mt-2 text-3xl font-bold uppercase leading-none tracking-[-0.03em] text-[var(--foreground)]">
            Ultimos movimientos
          </h2>

          <div className="mt-6 space-y-4">
            {recentActivity.map((item) => (
              <div key={item.title} className="flex gap-4 border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Activity className="h-4 w-4" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                  <p className="text-sm leading-6 text-[var(--foreground-soft)]">
                    {item.detail}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
