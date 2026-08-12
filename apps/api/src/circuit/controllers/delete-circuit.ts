import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { circuitTable } from "../../database/schema";

/** Assets on the circuit survive; their circuitId is set null by the foreign key. */
async function deleteCircuit(id: string, projectId: string) {
  const [existing] = await db
    .select()
    .from(circuitTable)
    .where(and(eq(circuitTable.id, id), eq(circuitTable.projectId, projectId)));

  if (!existing) {
    throw new HTTPException(404, {
      message: "Circuit doesn't exist in this project",
    });
  }

  await db.delete(circuitTable).where(eq(circuitTable.id, id));

  return existing;
}

export default deleteCircuit;
