import { and, asc, eq, sql } from "drizzle-orm";
import db from "../../database";
import { circuitTable, gridAssetTable, taskTable } from "../../database/schema";

type GetGridAssetsOptions = {
  assetType?: string;
  circuitId?: string;
};

/**
 * The structure register for a project: every grid asset with its circuit and a task
 * rollup, ordered the way a line is walked (by sequence, then designation).
 *
 * Progress is counted the same way project statistics count it -- complete, energized,
 * and archived all read as finished work.
 */
async function getGridAssets(
  projectId: string,
  { assetType, circuitId }: GetGridAssetsOptions = {},
) {
  const filters = [eq(gridAssetTable.projectId, projectId)];

  if (assetType) {
    filters.push(eq(gridAssetTable.assetType, assetType));
  }

  if (circuitId) {
    filters.push(eq(gridAssetTable.circuitId, circuitId));
  }

  const rows = await db
    .select({
      id: gridAssetTable.id,
      projectId: gridAssetTable.projectId,
      circuitId: gridAssetTable.circuitId,
      parentGridAssetId: gridAssetTable.parentGridAssetId,
      assetType: gridAssetTable.assetType,
      designation: gridAssetTable.designation,
      description: gridAssetTable.description,
      sequence: gridAssetTable.sequence,
      latitude: gridAssetTable.latitude,
      longitude: gridAssetTable.longitude,
      stationing: gridAssetTable.stationing,
      voltageKv: gridAssetTable.voltageKv,
      attributes: gridAssetTable.attributes,
      createdAt: gridAssetTable.createdAt,
      updatedAt: gridAssetTable.updatedAt,
      circuitDesignation: circuitTable.designation,
      taskCount: sql<number>`count(distinct ${taskTable.id})`.mapWith(Number),
      completedTaskCount:
        sql<number>`count(distinct case when ${taskTable.status} in ('complete', 'energized', 'archived') then ${taskTable.id} end)`.mapWith(
          Number,
        ),
    })
    .from(gridAssetTable)
    .leftJoin(circuitTable, eq(gridAssetTable.circuitId, circuitTable.id))
    .leftJoin(taskTable, eq(taskTable.gridAssetId, gridAssetTable.id))
    .where(and(...filters))
    .groupBy(gridAssetTable.id, circuitTable.designation)
    // Unsequenced assets sort last. The direction has to live inside the fragment:
    // wrapping it in asc() would emit "... nulls last asc", which Postgres rejects.
    .orderBy(
      sql`${gridAssetTable.sequence} asc nulls last`,
      asc(gridAssetTable.designation),
    );

  return rows.map((row) => ({
    ...row,
    completionPercentage:
      row.taskCount > 0
        ? Math.round((row.completedTaskCount / row.taskCount) * 100)
        : 0,
  }));
}

export default getGridAssets;
