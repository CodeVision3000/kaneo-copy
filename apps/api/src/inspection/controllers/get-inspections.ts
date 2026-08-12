import { and, asc, eq, sql } from "drizzle-orm";
import db from "../../database";
import {
  gridAssetTable,
  inspectionTable,
  taskTable,
} from "../../database/schema";

/**
 * Inspections for a project, soonest scheduled first. Optionally narrowed to one task,
 * which is how the task detail panel shows its hold points.
 */
async function getInspections(projectId: string, taskId?: string) {
  const filters = [eq(inspectionTable.projectId, projectId)];

  if (taskId) {
    filters.push(eq(inspectionTable.taskId, taskId));
  }

  return db
    .select({
      id: inspectionTable.id,
      projectId: inspectionTable.projectId,
      taskId: inspectionTable.taskId,
      gridAssetId: inspectionTable.gridAssetId,
      type: inspectionTable.type,
      description: inspectionTable.description,
      isHoldPoint: inspectionTable.isHoldPoint,
      status: inspectionTable.status,
      scheduledFor: inspectionTable.scheduledFor,
      performedAt: inspectionTable.performedAt,
      inspectorName: inspectionTable.inspectorName,
      result: inspectionTable.result,
      readings: inspectionTable.readings,
      createdAt: inspectionTable.createdAt,
      updatedAt: inspectionTable.updatedAt,
      gridAssetDesignation: gridAssetTable.designation,
      taskTitle: taskTable.title,
    })
    .from(inspectionTable)
    .leftJoin(
      gridAssetTable,
      eq(inspectionTable.gridAssetId, gridAssetTable.id),
    )
    .leftJoin(taskTable, eq(inspectionTable.taskId, taskTable.id))
    .where(and(...filters))
    .orderBy(
      sql`${inspectionTable.scheduledFor} asc nulls last`,
      asc(inspectionTable.type),
    );
}

export default getInspections;
