import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { circuitTable } from "../../database/schema";

export type CreateCircuitInput = {
  projectId: string;
  designation: string;
  name?: string | null;
  type?: string;
  voltageKv?: string | null;
  substationFrom?: string | null;
  substationTo?: string | null;
};

async function createCircuit({ projectId, ...fields }: CreateCircuitInput) {
  const [existing] = await db
    .select({ id: circuitTable.id })
    .from(circuitTable)
    .where(
      and(
        eq(circuitTable.projectId, projectId),
        eq(circuitTable.designation, fields.designation),
      ),
    );

  if (existing) {
    throw new HTTPException(409, {
      message: `Circuit "${fields.designation}" already exists in this project`,
    });
  }

  const [created] = await db
    .insert(circuitTable)
    .values({ projectId, ...fields })
    .returning();

  return created;
}

export default createCircuit;
