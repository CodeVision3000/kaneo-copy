// Utility work-order priority ladder. Mirrors VALID_PRIORITIES in
// apps/api/src/task/validate-task-fields.ts — keep the two in sync.
//
// routine    normal planned work
// expedited  pulled ahead of the routine queue
// urgent     must happen on the next available window
// emergency  storm or outage restoration; displaces everything else
export const TASK_PRIORITIES = [
  "no-priority",
  "routine",
  "expedited",
  "urgent",
  "emergency",
] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** Most severe first — the order filter and bulk-action menus present. */
export const TASK_PRIORITIES_BY_SEVERITY = [
  "emergency",
  "urgent",
  "expedited",
  "routine",
] as const;
