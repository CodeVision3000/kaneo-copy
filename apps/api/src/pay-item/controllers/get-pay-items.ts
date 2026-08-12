import { asc, eq, sql } from "drizzle-orm";
import db from "../../database";
import {
  constructionUnitTable,
  gridAssetTable,
  payItemTable,
  productionEntryTable,
} from "../../database/schema";

/** Pay items for a project with installed-to-date quantities. */
async function getPayItems(projectId: string) {
  return db
    .select({
      id: payItemTable.id,
      projectId: payItemTable.projectId,
      constructionUnitId: payItemTable.constructionUnitId,
      gridAssetId: payItemTable.gridAssetId,
      action: payItemTable.action,
      estimatedQuantity: payItemTable.estimatedQuantity,
      unitPrice: payItemTable.unitPrice,
      standardHours: payItemTable.standardHours,
      notes: payItemTable.notes,
      createdAt: payItemTable.createdAt,
      updatedAt: payItemTable.updatedAt,
      code: constructionUnitTable.code,
      description: constructionUnitTable.description,
      unitOfMeasure: constructionUnitTable.unitOfMeasure,
      gridAssetDesignation: gridAssetTable.designation,
      installedQuantity: sql<string>`coalesce(sum(${productionEntryTable.quantity}::numeric), 0)`,
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
    .orderBy(asc(constructionUnitTable.code), asc(payItemTable.action));
}

export default getPayItems;
