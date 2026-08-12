import { asc, eq, sql } from "drizzle-orm";
import db from "../../database";
import { circuitTable, gridAssetTable } from "../../database/schema";

/** Circuits in a project with a count of the assets hanging off each. */
async function getCircuits(projectId: string) {
  return db
    .select({
      id: circuitTable.id,
      projectId: circuitTable.projectId,
      designation: circuitTable.designation,
      name: circuitTable.name,
      type: circuitTable.type,
      voltageKv: circuitTable.voltageKv,
      substationFrom: circuitTable.substationFrom,
      substationTo: circuitTable.substationTo,
      createdAt: circuitTable.createdAt,
      updatedAt: circuitTable.updatedAt,
      assetCount: sql<number>`count(${gridAssetTable.id})`.mapWith(Number),
    })
    .from(circuitTable)
    .leftJoin(gridAssetTable, eq(gridAssetTable.circuitId, circuitTable.id))
    .where(eq(circuitTable.projectId, projectId))
    .groupBy(circuitTable.id)
    .orderBy(asc(circuitTable.designation));
}

export default getCircuits;
