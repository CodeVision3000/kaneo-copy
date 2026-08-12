import { and, asc, eq } from "drizzle-orm";
import db from "../../database";
import { constructionUnitTable } from "../../database/schema";

/** The workspace CU catalog, by code. */
async function getConstructionUnits(
  workspaceId: string,
  includeInactive = false,
) {
  const filters = [eq(constructionUnitTable.workspaceId, workspaceId)];

  if (!includeInactive) {
    filters.push(eq(constructionUnitTable.isActive, true));
  }

  return db
    .select()
    .from(constructionUnitTable)
    .where(and(...filters))
    .orderBy(asc(constructionUnitTable.code));
}

export default getConstructionUnits;
