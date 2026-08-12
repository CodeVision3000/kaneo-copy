import { asc, eq, sql } from "drizzle-orm";
import db from "../../database";
import { gridAssetTable, permitTable } from "../../database/schema";

/** Permits for a project, soonest expiry first so lapses surface at the top. */
async function getPermits(projectId: string) {
  return db
    .select({
      id: permitTable.id,
      projectId: permitTable.projectId,
      gridAssetId: permitTable.gridAssetId,
      type: permitTable.type,
      permitNumber: permitTable.permitNumber,
      description: permitTable.description,
      issuingAuthority: permitTable.issuingAuthority,
      status: permitTable.status,
      appliedAt: permitTable.appliedAt,
      issuedAt: permitTable.issuedAt,
      expiresAt: permitTable.expiresAt,
      notes: permitTable.notes,
      createdAt: permitTable.createdAt,
      updatedAt: permitTable.updatedAt,
      gridAssetDesignation: gridAssetTable.designation,
    })
    .from(permitTable)
    .leftJoin(gridAssetTable, eq(permitTable.gridAssetId, gridAssetTable.id))
    .where(eq(permitTable.projectId, projectId))
    .orderBy(
      sql`${permitTable.expiresAt} asc nulls last`,
      asc(permitTable.type),
    );
}

export default getPermits;
