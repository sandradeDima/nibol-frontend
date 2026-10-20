"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ErrorState } from "@/components/ui/error-state";

export default function ForbiddenPage() {
  const searchParams = useSearchParams();
  const missingPermission = searchParams.get("missing");

  return (
    <ErrorState
      action={
        <Link
          className="inline-flex items-center justify-center rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          href="/dashboard"
        >
          Volver al panel de control
        </Link>
      }
      description={
        missingPermission
          ? `Permiso faltante: ${missingPermission}.`
          : "Su cuenta está autenticada, pero no tiene acceso a esta sección."
      }
      title="No tiene permiso para ver esta página"
    />
  );
}
