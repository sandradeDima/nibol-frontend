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
          href="/"
        >
          Return to dashboard
        </Link>
      }
      description={
        missingPermission
          ? `Missing permission: ${missingPermission}.`
          : "Your account is authenticated, but this route is outside your assigned access."
      }
      title="You do not have permission to view this page"
    />
  );
}
