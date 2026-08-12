import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskTable } from "../../database/schema";
import { publishEvent } from "../../events";

/**
 * Records why work is stopped, independent of status. A crew can be held for weather
 * while the task still sits in "In Progress", and reporting needs to tell a weather day
 * apart from a missing clearance.
 */
async function updateTaskHold({
  id,
  holdReason,
  currentUserId,
}: {
  id: string;
  holdReason: string | null;
  currentUserId: string;
}) {
  const existingTask = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, id),
  });

  if (!existingTask) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  if (existingTask.holdReason === holdReason) {
    return existingTask;
  }

  const [updatedTask] = await db
    .update(taskTable)
    .set({ holdReason })
    .where(eq(taskTable.id, id))
    .returning();

  if (!updatedTask) {
    throw new HTTPException(500, {
      message: "Failed to update the task's hold reason",
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

export default updateTaskHold;
