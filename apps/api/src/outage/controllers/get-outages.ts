import { asc, eq, sql } from "drizzle-orm";
import db from "../../database";
import {
  circuitTable,
  outageTable,
  taskOutageTable,
} from "../../database/schema";

/**
 * Outages for a project, soonest window first, with a count of the tasks each one
 * gates. Unscheduled requests sort last -- the direction must live inside the SQL
 * fragment because asc() would emit "... nulls last asc".
 */
async function getOutages(projectId: string) {
  return db
    .select({
      id: outageTable.id,
      projectId: outageTable.projectId,
      circuitId: outageTable.circuitId,
      outageNumber: outageTable.outageNumber,
      title: outageTable.title,
      type: outageTable.type,
      status: outageTable.status,
      requestedStart: outageTable.requestedStart,
      requestedEnd: outageTable.requestedEnd,
      approvedStart: outageTable.approvedStart,
      approvedEnd: outageTable.approvedEnd,
      actualStart: outageTable.actualStart,
      actualEnd: outageTable.actualEnd,
      requestedById: outageTable.requestedById,
      approvedBy: outageTable.approvedBy,
      notes: outageTable.notes,
      createdAt: outageTable.createdAt,
      updatedAt: outageTable.updatedAt,
      circuitDesignation: circuitTable.designation,
      gatedTaskCount: sql<number>`count(${taskOutageTable.taskId})`.mapWith(
        Number,
      ),
    })
    .from(outageTable)
    .leftJoin(circuitTable, eq(outageTable.circuitId, circuitTable.id))
    .leftJoin(taskOutageTable, eq(taskOutageTable.outageId, outageTable.id))
    .where(eq(outageTable.projectId, projectId))
    .groupBy(outageTable.id, circuitTable.designation)
    .orderBy(
      sql`coalesce(${outageTable.approvedStart}, ${outageTable.requestedStart}) asc nulls last`,
      asc(outageTable.title),
    );
}

export default getOutages;
