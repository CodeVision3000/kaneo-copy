import { and, eq, inArray, notInArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../database";
import { columnTable, inspectionTable } from "../database/schema";
import { INSPECTION_STATUSES_SATISFYING_HOLD } from "../outage/gating-types";

/**
 * Statuses that mean the physical work is finished. A hold point exists to stop work
 * being called done before someone signed for it, so these are the transitions it
 * blocks. Moving a task backwards, or parking it, is always allowed -- a failed rebar
 * inspection has to be able to send work back to In Progress.
 */
const COMPLETION_STATUSES = ["complete", "energized"] as const;

export function isCompletionStatus(status: string): boolean {
  return (COMPLETION_STATUSES as readonly string[]).includes(status);
}

/**
 * Returns the hold-point inspections still standing in the way of completing a task.
 * Empty when the task is clear.
 */
export async function getOutstandingHoldPoints(taskId: string) {
  return db
    .select({
      id: inspectionTable.id,
      type: inspectionTable.type,
      status: inspectionTable.status,
      description: inspectionTable.description,
    })
    .from(inspectionTable)
    .where(
      and(
        eq(inspectionTable.taskId, taskId),
        eq(inspectionTable.isHoldPoint, true),
        notInArray(inspectionTable.status, [
          ...INSPECTION_STATUSES_SATISFYING_HOLD,
        ]),
      ),
    );
}

/**
 * Blocks completing a task that still has an open hold point.
 *
 * Called from every path that changes a task's status. Deliberately a no-op unless the
 * target status is a completion status: gating every transition would make a failed
 * inspection impossible to record, because you could not move the work back.
 */
export async function assertHoldPointsCleared(
  taskId: string,
  nextStatus: string,
): Promise<void> {
  if (!isCompletionStatus(nextStatus)) {
    return;
  }

  const outstanding = await getOutstandingHoldPoints(taskId);

  if (outstanding.length === 0) {
    return;
  }

  const summary = outstanding
    .map((inspection) => inspection.description || inspection.type)
    .join(", ");

  throw new HTTPException(409, {
    message: `Can't complete this task until its hold point inspections pass or are waived: ${summary}`,
  });
}

/**
 * Bulk variant: returns the subset of task ids that may move to nextStatus, plus the
 * ones blocked and why. Bulk moves shouldn't fail wholesale because one task in the
 * selection has an open hold point.
 */
export async function partitionByHoldPoints(
  taskIds: string[],
  nextStatus: string,
): Promise<{
  allowed: string[];
  blocked: Array<{ taskId: string; reason: string }>;
}> {
  if (!isCompletionStatus(nextStatus) || taskIds.length === 0) {
    return { allowed: taskIds, blocked: [] };
  }

  const outstanding = await db
    .select({
      taskId: inspectionTable.taskId,
      type: inspectionTable.type,
      description: inspectionTable.description,
    })
    .from(inspectionTable)
    .where(
      and(
        inArray(inspectionTable.taskId, taskIds),
        eq(inspectionTable.isHoldPoint, true),
        notInArray(inspectionTable.status, [
          ...INSPECTION_STATUSES_SATISFYING_HOLD,
        ]),
      ),
    );

  const reasonsByTask = new Map<string, string[]>();
  for (const row of outstanding) {
    if (!row.taskId) continue;
    const reasons = reasonsByTask.get(row.taskId) ?? [];
    reasons.push(row.description || row.type);
    reasonsByTask.set(row.taskId, reasons);
  }

  return {
    allowed: taskIds.filter((id) => !reasonsByTask.has(id)),
    blocked: [...reasonsByTask].map(([taskId, reasons]) => ({
      taskId,
      reason: `Open hold point: ${reasons.join(", ")}`,
    })),
  };
}

/** True when the given slug is a final column in the project. */
export async function isFinalColumn(
  projectId: string,
  slug: string,
): Promise<boolean> {
  const [column] = await db
    .select({ isFinal: columnTable.isFinal })
    .from(columnTable)
    .where(
      and(eq(columnTable.projectId, projectId), eq(columnTable.slug, slug)),
    )
    .limit(1);

  return column?.isFinal ?? false;
}
