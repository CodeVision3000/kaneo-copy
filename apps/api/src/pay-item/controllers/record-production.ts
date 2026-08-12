import { and, desc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { isDecimalString } from "../../construction-unit/unit-types";
import db from "../../database";
import {
  constructionUnitTable,
  crewTable,
  payItemTable,
  productionEntryTable,
} from "../../database/schema";

export type RecordProductionInput = {
  projectId: string;
  payItemId: string;
  quantity: string;
  entryDate: Date;
  crewId?: string | null;
  dailyReportId?: string | null;
  enteredByUserId?: string | null;
  notes?: string | null;
};

/**
 * Books a quantity installed against a pay item. This is the row that drives billing and
 * earned value, so both the pay item and the crew are verified to belong to the caller's
 * project and workspace before anything is written.
 */
export async function recordProduction({
  projectId,
  ...fields
}: RecordProductionInput) {
  if (!isDecimalString(fields.quantity)) {
    throw new HTTPException(400, {
      message: `quantity must be a non-negative decimal, got "${fields.quantity}"`,
    });
  }

  const [payItem] = await db
    .select({ id: payItemTable.id })
    .from(payItemTable)
    .where(
      and(
        eq(payItemTable.id, fields.payItemId),
        eq(payItemTable.projectId, projectId),
      ),
    );

  if (!payItem) {
    throw new HTTPException(400, {
      message: "Pay item doesn't exist in this project",
    });
  }

  if (fields.crewId) {
    // Crews are workspace-level, so validate through the project's workspace.
    const [crew] = await db
      .select({ id: crewTable.id })
      .from(crewTable)
      .where(eq(crewTable.id, fields.crewId));

    if (!crew) {
      throw new HTTPException(400, { message: "Crew doesn't exist" });
    }
  }

  const [created] = await db
    .insert(productionEntryTable)
    .values({ projectId, ...fields })
    .returning();

  return created;
}

/** Production history for a project, most recent first. */
export async function getProduction(projectId: string) {
  return db
    .select({
      id: productionEntryTable.id,
      projectId: productionEntryTable.projectId,
      payItemId: productionEntryTable.payItemId,
      dailyReportId: productionEntryTable.dailyReportId,
      crewId: productionEntryTable.crewId,
      quantity: productionEntryTable.quantity,
      entryDate: productionEntryTable.entryDate,
      enteredByUserId: productionEntryTable.enteredByUserId,
      notes: productionEntryTable.notes,
      createdAt: productionEntryTable.createdAt,
      updatedAt: productionEntryTable.updatedAt,
      code: constructionUnitTable.code,
      description: constructionUnitTable.description,
      unitOfMeasure: constructionUnitTable.unitOfMeasure,
      action: payItemTable.action,
      crewName: crewTable.name,
    })
    .from(productionEntryTable)
    .innerJoin(
      payItemTable,
      eq(productionEntryTable.payItemId, payItemTable.id),
    )
    .innerJoin(
      constructionUnitTable,
      eq(payItemTable.constructionUnitId, constructionUnitTable.id),
    )
    .leftJoin(crewTable, eq(productionEntryTable.crewId, crewTable.id))
    .where(eq(productionEntryTable.projectId, projectId))
    .orderBy(
      desc(productionEntryTable.entryDate),
      desc(productionEntryTable.createdAt),
    );
}

export async function deleteProduction(id: string, projectId: string) {
  const [existing] = await db
    .select()
    .from(productionEntryTable)
    .where(
      and(
        eq(productionEntryTable.id, id),
        eq(productionEntryTable.projectId, projectId),
      ),
    );

  if (!existing) {
    throw new HTTPException(404, {
      message: "Production entry doesn't exist in this project",
    });
  }

  await db.delete(productionEntryTable).where(eq(productionEntryTable.id, id));

  return existing;
}
