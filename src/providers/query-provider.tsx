"use client";

import {
  QueryClient,
  QueryClientProvider,
  useIsMutating,
} from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useState, type ReactNode } from "react";

type QueryProviderProps = {
  children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <MutationBlockingOverlay />
    </QueryClientProvider>
  );
}

function MutationBlockingOverlay() {
  const mutationCount = useIsMutating();
  if (!mutationCount) return null;

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex cursor-wait items-center justify-center bg-stone-950/20 backdrop-blur-[1px]"
      role="status"
    >
      <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-900 shadow-xl">
        <LoaderCircle
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-amber-700"
        />
        Procesando…
      </div>
    </div>
  );
}
