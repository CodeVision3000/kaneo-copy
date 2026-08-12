import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { isDecimalString } from "../../construction-unit/unit-types";
import db from "../../database";
import {
  constructionUnitTable,
  gridAssetTable,
  payItemTable,
} from "../../database/schema";

export type PayItemFields = {
  constructionUnitId?: string;
  gridAssetId?: string | null;
  action?: string;
  estimatedQuantity?: string;
  unitPrice?: string | null;
  standardHours?: string | null;
  notes?: string | null;
};

function assertDecimals(fields: PayItemFields) {
  for (const field of [
    "estimatedQuantity",
    "unitPrice",
    "standardHours",
  ] as const) {
    const value = fields[field];
    if (value === undefined || value === null || value === "") continue;
    if (!isDecimalString(value)) {
      throw new HTTPException(400, {
        message: `${field} must be a non-negative decimal, got "${value}"`,
      });
    }
  }
}

/**
 * Pulls the price and standard hours for the requested action off the catalog entry, so
 * a pay item created without explicit rates is still valued.
 *
 * The snapshot is deliberate: repricing the catalog later must not silently restate the
 * value of work already bid.
 */
async function resolveCatalogDefaults(
  workspaceId: string,
  constructionUnitId: string,
  action: string,
) {
  const [unit] = await db
    .select()
    .from(constructionUnitTable)
    .where(
      and(
        eq(constructionUnitTable.id, constructionUnitId),
        eq(constructionUnitTable.workspaceId, workspaceId),
      ),
    );

  if (!unit) {
    throw new HTTPException(400, {
      message: "Construction unit doesn't exist in this workspace",
    });
  }

  // "relocate" is a remove plus an install; utilities price it off the transfer rate.
  const key = action === "relocate" ? "transfer" : action;

  const price =
    key === "remove"
      ? unit.removePrice
      : key === "transfer"
        ? unit.transferPrice
        : unit.installPrice;

  const hours =
    key === "remove"
      ? unit.removeHours
      : key === "transfer"
        ? unit.transferHours
        : unit.installHours;

  return { price, hours };
}

async function assertAssetInProject(
  projectId: string,
  gridAssetId?: string | null,
) {
  if (!gridAssetId) return;

  const [asset] = await db
    .select({ id: gridAssetTable.id })
    .from(gridAssetTable)
    .where(
      and(
        eq(gridAssetTable.id, gridAssetId),
        eq(gridAssetTable.projectId, projectId),
      ),
    );

  if (!asset) {
    throw new HTTPException(400, {
      message: "Asset doesn't exist in this project",
    });
  }
}

export async function createPayItem(
  projectId: string,
  workspaceId: string,
  fields: PayItemFields & { constructionUnitId: string },
) {
  assertDecimals(fields);
  await assertAssetInProject(projectId, fields.gridAssetId);

  const action = fields.action ?? "install";
  const defaults = await resolveCatalogDefaults(
    workspaceId,
    fields.constructionUnitId,
    action,
  );

  const [existing] = await db
    .select({ id: payItemTable.id })
    .from(payItemTable)
    .where(
      and(
        eq(payItemTable.projectId, projectId),
        eq(payItemTable.constructionUnitId, fields.constructionUnitId),
        eq(payItemTable.action, action),
      ),
    );

  // The unique constraint spans the optional asset too, but NULLs don't collide in
  // Postgres, so an explicit check keeps the common project-level case clean.
  if (existing && !fields.gridAssetId) {
    throw new HTTPException(409, {
      message:
        "This construction unit and action already has a project-level pay item",
    });
  }

  const [created] = await db
    .insert(payItemTable)
    .values({
      projectId,
      constructionUnitId: fields.constructionUnitId,
      gridAssetId: fields.gridAssetId ?? null,
      action,
      estimatedQuantity: fields.estimatedQuantity ?? "0",
      unitPrice: fields.unitPrice ?? defaults.price,
      standardHours: fields.standardHours ?? defaults.hours,
      notes: fields.notes ?? null,
    })
    .returning();

  return created;
}

export async function updatePayItem(
  id: string,
  projectId: string,
  fields: PayItemFields,
) {
  assertDecimals(fields);

  const [existing] = await db
    .select({ id: payItemTable.id })
    .from(payItemTable)
    .where(and(eq(payItemTable.id, id), eq(payItemTable.projectId, projectId)));

  if (!existing) {
    throw new HTTPException(404, {
      message: "Pay item doesn't exist in this project",
    });
  }

  await assertAssetInProject(projectId, fields.gridAssetId);

  const updates = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );

  const [updated] = await db
    .update(payItemTable)
    .set(updates)
    .where(eq(payItemTable.id, id))
    .returning();

  return updated;
}

export async function deletePayItem(id: string, projectId: string) {
  const [existing] = await db
    .select()
    .from(payItemTable)
    .where(and(eq(payItemTable.id, id), eq(payItemTable.projectId, projectId)));

  if (!existing) {
    throw new HTTPException(404, {
      message: "Pay item doesn't exist in this project",
    });
  }

  // Production entries cascade with the pay item: quantities booked against a deleted
  // line item have nothing to value them against.
  await db.delete(payItemTable).where(eq(payItemTable.id, id));

  return existing;
}
