export interface ReviewTaskSummary {
  allowedActions: string[];
  canAct: boolean;
  id: string | null;
  status: string;
}
