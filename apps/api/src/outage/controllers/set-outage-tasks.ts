import { and, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { outageTable, taskOutageTable, taskTable } from "../../database/schema";

/**
 * Replaces the set of tasks a clearance gates. Sent as a whole set rather than
 * add/remove calls because the UI edits it as a checklist.
 */
async function setOutageTasks(
  outageId: string,
  projectId: string,
  taskIds: string[],
) {
  const [outage] = await db
    .select({ id: outageTable.id })
    .from(outageTable)
    .where(
      and(eq(outageTable.id, outageId), eq(outageTable.projectId, projectId)),
    );

  if (!outage) {
    throw new HTTPException(404, {
      message: "Outage doesn't exist in this project",
    });
  }

  const unique = [...new Set(taskIds)];

  if (unique.length > 0) {
    const owned = await db
      .select({ id: taskTable.id })
      .from(taskTable)
      .where(
        and(inArray(taskTable.id, unique), eq(taskTable.projectId, projectId)),
      );

    if (owned.length !== unique.length) {
      throw new HTTPException(400, {
        message: "Every gated task must belong to the same project",
      });
    }
  }

  return db.transaction(async (tx) => {
    await tx
      .delete(taskOutageTable)
      .where(eq(taskOutageTable.outageId, outageId));

    if (unique.length > 0) {
      await tx
        .insert(taskOutageTable)
        .values(unique.map((taskId) => ({ outageId, taskId })));
    }

    return { outageId, taskIds: unique };
  });
}

export default setOutageTasks;
