import { eq, sql } from "drizzle-orm";
import db from "../../database";
import {
  constructionUnitTable,
  dailyReportTable,
  gridAssetTable,
  laborEntryTable,
  payItemTable,
  productionEntryTable,
} from "../../database/schema";

/**
 * Earned value for a project, per pay item and in total.
 *
 * Quantities, prices, and hours are stored as text so decimal money survives round-trips
 * without binary float error; they are cast to numeric here so the arithmetic is exact in
 * Postgres rather than approximate in JavaScript.
 *
 *   earned revenue = installed qty x unit price
 *   earned hours   = installed qty x standard hours
 *
 * Actual hours come from the daily reports' labor entries. Earned hours minus actual hours
 * is the number a project manager actually wants: positive means the crews are beating the
 * estimate, negative means the job is losing.
 */
async function getEarnedValue(projectId: string) {
  const perItem = await db
    .select({
      payItemId: payItemTable.id,
      action: payItemTable.action,
      code: constructionUnitTable.code,
      description: constructionUnitTable.description,
      unitOfMeasure: constructionUnitTable.unitOfMeasure,
      gridAssetDesignation: gridAssetTable.designation,
      estimatedQuantity: sql<string>`${payItemTable.estimatedQuantity}::numeric`,
      unitPrice: sql<string>`coalesce(${payItemTable.unitPrice}, '0')::numeric`,
      standardHours: sql<string>`coalesce(${payItemTable.standardHours}, '0')::numeric`,
      installedQuantity: sql<string>`coalesce(sum(${productionEntryTable.quantity}::numeric), 0)`,
      budgetValue: sql<string>`(${payItemTable.estimatedQuantity}::numeric * coalesce(${payItemTable.unitPrice}, '0')::numeric)`,
      budgetHours: sql<string>`(${payItemTable.estimatedQuantity}::numeric * coalesce(${payItemTable.standardHours}, '0')::numeric)`,
      earnedValue: sql<string>`(coalesce(sum(${productionEntryTable.quantity}::numeric), 0) * coalesce(${payItemTable.unitPrice}, '0')::numeric)`,
      earnedHours: sql<string>`(coalesce(sum(${productionEntryTable.quantity}::numeric), 0) * coalesce(${payItemTable.standardHours}, '0')::numeric)`,
    })
    .from(payItemTable)
    .innerJoin(
      constructionUnitTable,
      eq(payItemTable.constructionUnitId, constructionUnitTable.id),
    )
    .leftJoin(gridAssetTable, eq(payItemTable.gridAssetId, gridAssetTable.id))
    .leftJoin(
      productionEntryTable,
      eq(productionEntryTable.payItemId, payItemTable.id),
    )
    .where(eq(payItemTable.projectId, projectId))
    .groupBy(
      payItemTable.id,
      constructionUnitTable.code,
      constructionUnitTable.description,
      constructionUnitTable.unitOfMeasure,
      gridAssetTable.designation,
    )
    .orderBy(constructionUnitTable.code, payItemTable.action);

  // Actual hours are tracked per person per day, independent of pay items, so they
  // cannot be joined into the per-item query without multiplying the quantities.
  const [actuals] = await db
    .select({
      actualHours: sql<string>`coalesce(sum(
        ${laborEntryTable.regularHours}::numeric
        + ${laborEntryTable.overtimeHours}::numeric
        + ${laborEntryTable.doubleTimeHours}::numeric
      ), 0)`,
    })
    .from(laborEntryTable)
    .innerJoin(
      dailyReportTable,
      eq(laborEntryTable.dailyReportId, dailyReportTable.id),
    )
    .where(eq(dailyReportTable.projectId, projectId));

  const items = perItem.map((row) => {
    const budgetValue = Number(row.budgetValue);
    const earnedValue = Number(row.earnedValue);
    const estimated = Number(row.estimatedQuantity);
    const installed = Number(row.installedQuantity);

    return {
      ...row,
      percentComplete:
        estimated > 0 ? Math.round((installed / estimated) * 100) : 0,
      remainingValue: budgetValue - earnedValue,
    };
  });

  const sum = (pick: (item: (typeof items)[number]) => string) =>
    items.reduce((total, item) => total + Number(pick(item)), 0);

  const budgetHours = sum((i) => i.budgetHours);
  const earnedHours = sum((i) => i.earnedHours);
  const actualHours = Number(actuals?.actualHours ?? 0);
  const budgetValue = sum((i) => i.budgetValue);
  const earnedValue = sum((i) => i.earnedValue);

  return {
    items,
    totals: {
      budgetValue,
      earnedValue,
      remainingValue: budgetValue - earnedValue,
      budgetHours,
      earnedHours,
      actualHours,
      /** Positive means crews are beating the estimate. */
      hoursVariance: earnedHours - actualHours,
      /**
       * Earned hours per actual hour. Above 1.0 is ahead of the estimate. Null when no
       * hours have been charged yet, rather than a misleading zero.
       */
      productivityFactor: actualHours > 0 ? earnedHours / actualHours : null,
      percentComplete:
        budgetValue > 0 ? Math.round((earnedValue / budgetValue) * 100) : 0,
    },
  };
}

export default getEarnedValue;
