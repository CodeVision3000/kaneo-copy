import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { gridAssetTable, taskTable } from "../../database/schema";
import { publishEvent } from "../../events";

/**
 * Attaches work to a physical position on the grid, or clears the link when
 * gridAssetId is null. The asset must belong to the same project as the task, so a
 * structure from one job can't collect another job's work.
 */
async function updateTaskGridAsset({
  id,
  gridAssetId,
  currentUserId,
}: {
  id: string;
  gridAssetId: string | null;
  currentUserId: string;
}) {
  const existingTask = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, id),
  });

  if (!existingTask) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  if (gridAssetId) {
    const [asset] = await db
      .select({ id: gridAssetTable.id })
      .from(gridAssetTable)
      .where(
        and(
          eq(gridAssetTable.id, gridAssetId),
          eq(gridAssetTable.projectId, existingTask.projectId),
        ),
      );

    if (!asset) {
      throw new HTTPException(400, {
        message: "Asset doesn't exist in this task's project",
      });
    }
  }

  if (existingTask.gridAssetId === gridAssetId) {
    return existingTask;
  }

  const [updatedTask] = await db
    .update(taskTable)
    .set({ gridAssetId })
    .where(eq(taskTable.id, id))
    .returning();

  if (!updatedTask) {
    throw new HTTPException(500, {
      message: "Failed to update the task's grid asset",
    });
  }

  await publishEvent("task.updated", {
    taskId: updatedTask.id,
    projectId: updatedTask.projectId,
    title: updatedTask.title,
    status: updatedTask.status,
    userId: currentUserId,
  });

  return updatedTask;
}

export default updateTaskGridAsset;
