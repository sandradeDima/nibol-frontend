export type ObservationTab =
  | "comentarios"
  | "evidence"
  | "history"
  | "plans"
  | "summary";

export const buildObservationUrl = ({
  advanceId,
  evidenceId,
  extensionId,
  observationId,
  planId,
  returnTo,
  tab,
}: {
  advanceId?: string;
  evidenceId?: string;
  extensionId?: string;
  observationId: string;
  planId?: string;
  returnTo?: string;
  tab?: ObservationTab;
}): string => {
  const params = new URLSearchParams();
  if (tab) params.set("tab", tab);
  if (planId) params.set("planId", planId);
  if (advanceId) params.set("advanceId", advanceId);
  if (extensionId) params.set("extensionId", extensionId);
  if (evidenceId) params.set("evidenceId", evidenceId);
  if (returnTo) params.set("returnTo", returnTo);
  const query = params.toString();
  return `/observaciones/${encodeURIComponent(observationId)}${query ? `?${query}` : ""}`;
};
