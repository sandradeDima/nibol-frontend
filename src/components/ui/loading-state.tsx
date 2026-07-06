import { StatCardSkeleton } from "@/components/ui/stat-card";

type LoadingStateProps = {
  cards?: number;
  title?: string;
};

export function LoadingState({
  cards = 4,
  title = "Loading workspace",
}: LoadingStateProps) {
  return (
    <div className="space-y-6">
      <section className="border border-[var(--border)] bg-[var(--surface)] px-6 py-6 shadow-[var(--shadow-panel)] sm:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-28 bg-[var(--border)]" />
          <div className="h-10 w-56 bg-[var(--border)]" />
          <div className="h-4 w-full max-w-2xl bg-[var(--border)]" />
          <div className="h-4 w-3/4 max-w-xl bg-[var(--border)]" />
        </div>
        <p className="mt-5 text-sm font-medium text-[var(--muted)]">{title}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </section>

      <section className="border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-panel)]">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-[var(--border)]" />
          <div className="h-4 w-full bg-[var(--border)]" />
          <div className="h-4 w-5/6 bg-[var(--border)]" />
          <div className="h-32 bg-[var(--border)]" />
        </div>
      </section>
    </div>
  );
}
