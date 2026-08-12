import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { circuitTable, outageTable } from "../../database/schema";
import { assertWindowOrder } from "./create-outage";

export type UpdateOutageInput = {
  id: string;
  projectId: string;
  title?: string;
  circuitId?: string | null;
  outageNumber?: string | null;
  type?: string;
  status?: string;
  requestedStart?: Date | null;
  requestedEnd?: Date | null;
  approvedStart?: Date | null;
  approvedEnd?: Date | null;
  actualStart?: Date | null;
  actualEnd?: Date | null;
  approvedBy?: string | null;
  notes?: string | null;
};

async function updateOutage({ id, projectId, ...fields }: UpdateOutageInput) {
  const [existing] = await db
    .select()
    .from(outageTable)
    .where(and(eq(outageTable.id, id), eq(outageTable.projectId, projectId)));

  if (!existing) {
    throw new HTTPException(404, {
      message: "Outage doesn't exist in this project",
    });
  }

  if (fields.circuitId) {
    const [circuit] = await db
      .select({ id: circuitTable.id })
      .from(circuitTable)
      .where(
        and(
          eq(circuitTable.id, fields.circuitId),
          eq(circuitTable.projectId, projectId),
        ),
      );

    if (!circuit) {
      throw new HTTPException(400, {
        message: "Circuit doesn't exist in this project",
      });
    }
  }

  // Validate against the merged record, not just the payload: approving a window
  // sends only approvedStart/End, but the stored requested window still has to make
  // sense afterwards.
  const merged = { ...existing, ...stripUndefined(fields) };
  assertWindowOrder(merged.requestedStart, merged.requestedEnd, "Requested");
  assertWindowOrder(merged.approvedStart, merged.approvedEnd, "Approved");
  assertWindowOrder(merged.actualStart, merged.actualEnd, "Actual");

  const [updated] = await db
    .update(outageTable)
    .set(stripUndefined(fields))
    .where(eq(outageTable.id, id))
    .returning();

  return updated;
}

function stripUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export default updateOutage;
