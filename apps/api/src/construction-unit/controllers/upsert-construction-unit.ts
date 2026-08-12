import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { constructionUnitTable } from "../../database/schema";
import { isDecimalString } from "../unit-types";

export type ConstructionUnitFields = {
  code?: string;
  description?: string;
  unitOfMeasure?: string;
  discipline?: string | null;
  installHours?: string | null;
  removeHours?: string | null;
  transferHours?: string | null;
  installPrice?: string | null;
  removePrice?: string | null;
  transferPrice?: string | null;
  isActive?: boolean;
};

const DECIMAL_FIELDS = [
  "installHours",
  "removeHours",
  "transferHours",
  "installPrice",
  "removePrice",
  "transferPrice",
] as const;

/**
 * Rejects a value that wouldn't survive the ::numeric cast the earned-value query
 * performs, so a bad rate can't poison reporting later.
 */
function assertDecimals(fields: ConstructionUnitFields) {
  for (const field of DECIMAL_FIELDS) {
    const value = fields[field];
    if (value === undefined || value === null || value === "") continue;
    if (!isDecimalString(value)) {
      throw new HTTPException(400, {
        message: `${field} must be a non-negative decimal, got "${value}"`,
      });
    }
  }
}

export async function createConstructionUnit(
  workspaceId: string,
  fields: ConstructionUnitFields & { code: string; description: string },
) {
  assertDecimals(fields);

  const [existing] = await db
    .select({ id: constructionUnitTable.id })
    .from(constructionUnitTable)
    .where(
      and(
        eq(constructionUnitTable.workspaceId, workspaceId),
        eq(constructionUnitTable.code, fields.code),
      ),
    );

  if (existing) {
    throw new HTTPException(409, {
      message: `Construction unit "${fields.code}" already exists in this workspace`,
    });
  }

  const [created] = await db
    .insert(constructionUnitTable)
    .values({ workspaceId, ...fields })
    .returning();

  return created;
}

export async function updateConstructionUnit(
  id: string,
  workspaceId: string,
  fields: ConstructionUnitFields,
) {
  assertDecimals(fields);

  const [existing] = await db
    .select({ id: constructionUnitTable.id })
    .from(constructionUnitTable)
    .where(
      and(
        eq(constructionUnitTable.id, id),
        eq(constructionUnitTable.workspaceId, workspaceId),
      ),
    );

  if (!existing) {
    throw new HTTPException(404, {
      message: "Construction unit doesn't exist in this workspace",
    });
  }

  const updates = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );

  const [updated] = await db
    .update(constructionUnitTable)
    .set(updates)
    .where(eq(constructionUnitTable.id, id))
    .returning();

  return updated;
}
