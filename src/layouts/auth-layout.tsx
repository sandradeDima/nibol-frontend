import type { ReactNode } from "react";

import Image from "next/image";
import { LockKeyhole, ShieldCheck } from "lucide-react";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,var(--background)_100%)] px-4 py-4 text-[var(--foreground)] sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[1500px] overflow-hidden border border-[var(--border)] bg-white shadow-[var(--shadow-panel-strong)] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <section className="flex flex-col justify-between border-b border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,var(--surface-soft)_100%)] px-8 py-10 lg:border-b-0 lg:border-r lg:px-14 lg:py-14">
          <div className="space-y-12">
            <div className="flex items-center justify-between gap-4">
              <Image
                alt="NIBOL Bolivia"
                className="h-auto w-[10.5rem]"
                height={57}
                priority
                src="/assets/logo-nibol-negro-ok1.png"
                width={282}
              />
              <span className="nibol-badge nibol-badge-primary">Acceso interno</span>
            </div>

            <div className="mx-auto flex max-w-xl flex-1 flex-col justify-center text-center lg:text-left">
              <p className="nibol-eyebrow">Sistema corporativo</p>
              <h1 className="font-display mt-5 text-5xl font-bold uppercase leading-none tracking-[-0.03em] text-[var(--foreground)] sm:text-6xl">
                Seguimiento de riesgos
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[var(--foreground-soft)]">
                Plataforma interna para seguimiento de hallazgos, riesgos y planes
                de remediacion con una interfaz alineada a la identidad visual de
                NIBOL.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="nibol-panel flex items-start gap-3 px-5 py-5">
              <div className="mt-1 flex h-10 w-10 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-base font-bold uppercase text-[var(--foreground)]">
                  Seguridad corporativa
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Sesiones protegidas, permisos por rol y acceso restringido a
                  modulos sensibles.
                </p>
              </div>
            </div>

            <div className="nibol-panel flex items-start gap-3 px-5 py-5">
              <div className="mt-1 flex h-10 w-10 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-base font-bold uppercase text-[var(--foreground)]">
                  Acceso controlado
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Inicio de sesion, verificacion y recuperacion listos para el flujo
                  corporativo actual.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[var(--background)] px-6 py-10 sm:px-10 lg:px-12">
          {children}
        </section>
      </div>
    </main>
  );
}
