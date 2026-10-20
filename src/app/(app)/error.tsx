"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      action={
        <button
          className="inline-flex items-center justify-center rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          onClick={() => {
            reset();
          }}
          type="button"
        >
          Intentar de nuevo
        </button>
      }
      description="Ocurrió un problema al preparar esta área de administración. Intente nuevamente o vuelva al panel de control."
      title="Se produjo un problema inesperado"
    />
  );
}
