import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { outageTable } from "../../database/schema";

/** Task links cascade away; the tasks themselves are untouched. */
async function deleteOutage(id: string, projectId: string) {
  const [existing] = await db
    .select()
    .from(outageTable)
    .where(and(eq(outageTable.id, id), eq(outageTable.projectId, projectId)));

  if (!existing) {
    throw new HTTPException(404, {
      message: "Outage doesn't exist in this project",
    });
  }

  await db.delete(outageTable).where(eq(outageTable.id, id));

  return existing;
}

export default deleteOutage;
