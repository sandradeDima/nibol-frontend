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
        <section className="flex flex-col justify-between border-b border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,var(--surface-soft)_100%)] px-8 py-10 lg:border-r lg:border-b-0 lg:px-14 lg:py-14">
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
              <span className="nibol-badge nibol-badge-primary">
                Acceso interno
              </span>
            </div>

            <div className="relative isolate mx-auto flex min-h-[18rem] max-w-[52rem] flex-1 flex-col justify-center overflow-hidden text-center lg:text-left">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-0 bottom-0 z-[-1] h-[44%] w-[38%] bg-[#eef2f6] [clip-path:polygon(100%_0,100%_100%,0_100%)]"
              />
              <div className="relative">
                <p className="nibol-eyebrow text-[#7b8daa]">
                  Sistema corporativo
                </p>
                <h1 className="font-display mt-5 text-[clamp(3rem,4vw,4.5rem)] leading-[0.96] font-extrabold tracking-[-0.035em] text-[var(--foreground-strong)] uppercase">
                  <span className="block">Seguimiento de</span>
                  <span className="block">hallazgos y planes de acción</span>
                </h1>
                <p className="mt-5 max-w-3xl text-[1.1rem] leading-[1.55] text-[#7b8daa]">
                  Plataforma interna para seguimiento de hallazgos y planes de
                  acción{" "}
                  <span className="lg:block">
                    con una interfaz alineada a la identidad visual de NIBOL.
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="nibol-panel flex items-start gap-3 px-5 py-5">
              <div className="mt-1 flex h-10 w-10 items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-base font-bold text-[var(--foreground)] uppercase">
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
                <p className="font-display text-base font-bold text-[var(--foreground)] uppercase">
                  Acceso controlado
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Inicio de sesion, verificacion y recuperacion listos para el
                  flujo corporativo actual.
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
