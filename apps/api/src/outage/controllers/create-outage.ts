import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { circuitTable, outageTable } from "../../database/schema";

export type CreateOutageInput = {
  projectId: string;
  title: string;
  requestedById?: string | null;
  circuitId?: string | null;
  outageNumber?: string | null;
  type?: string;
  status?: string;
  requestedStart?: Date | null;
  requestedEnd?: Date | null;
  notes?: string | null;
};

async function createOutage({ projectId, ...fields }: CreateOutageInput) {
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

  assertWindowOrder(fields.requestedStart, fields.requestedEnd, "Requested");

  const [created] = await db
    .insert(outageTable)
    .values({ projectId, ...fields })
    .returning();

  return created;
}

/** A window that ends before it starts is always a data-entry mistake. */
export function assertWindowOrder(
  start: Date | null | undefined,
  end: Date | null | undefined,
  label: string,
) {
  if (start && end && end.getTime() < start.getTime()) {
    throw new HTTPException(400, {
      message: `${label} end must be at or after ${label.toLowerCase()} start`,
    });
  }
}

export default createOutage;
