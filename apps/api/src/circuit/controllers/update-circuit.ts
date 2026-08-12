import { and, eq, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { circuitTable } from "../../database/schema";

export type UpdateCircuitInput = {
  id: string;
  projectId: string;
  designation?: string;
  name?: string | null;
  type?: string;
  voltageKv?: string | null;
  substationFrom?: string | null;
  substationTo?: string | null;
};

async function updateCircuit({ id, projectId, ...fields }: UpdateCircuitInput) {
  const [existing] = await db
    .select({ id: circuitTable.id })
    .from(circuitTable)
    .where(and(eq(circuitTable.id, id), eq(circuitTable.projectId, projectId)));

  if (!existing) {
    throw new HTTPException(404, {
      message: "Circuit doesn't exist in this project",
    });
  }

  if (fields.designation) {
    const [conflict] = await db
      .select({ id: circuitTable.id })
      .from(circuitTable)
      .where(
        and(
          eq(circuitTable.projectId, projectId),
          eq(circuitTable.designation, fields.designation),
          ne(circuitTable.id, id),
        ),
      );

    if (conflict) {
      throw new HTTPException(409, {
        message: `Circuit "${fields.designation}" already exists in this project`,
      });
    }
  }

  const updates = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );

  const [updated] = await db
    .update(circuitTable)
    .set(updates)
    .where(eq(circuitTable.id, id))
    .returning();

  return updated;
}

export default updateCircuit;
