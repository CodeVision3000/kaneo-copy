import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  gridAssetTable,
  inspectionTable,
  taskTable,
} from "../../database/schema";

export type InspectionFields = {
  type?: string;
  description?: string | null;
  isHoldPoint?: boolean;
  status?: string;
  scheduledFor?: Date | null;
  performedAt?: Date | null;
  inspectorName?: string | null;
  result?: string | null;
  readings?: unknown;
  taskId?: string | null;
  gridAssetId?: string | null;
};

/**
 * A hold point that pointed at another project's task would be unenforceable, so both
 * references are checked against the project.
 */
async function assertReferencesInProject(
  projectId: string,
  { taskId, gridAssetId }: Pick<InspectionFields, "taskId" | "gridAssetId">,
) {
  if (taskId) {
    const [task] = await db
      .select({ id: taskTable.id })
      .from(taskTable)
      .where(and(eq(taskTable.id, taskId), eq(taskTable.projectId, projectId)));

    if (!task) {
      throw new HTTPException(400, {
        message: "Task doesn't exist in this project",
      });
    }
  }

  if (gridAssetId) {
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
}

export async function createInspection(
  projectId: string,
  fields: InspectionFields & { type: string },
) {
  await assertReferencesInProject(projectId, fields);

  const [created] = await db
    .insert(inspectionTable)
    .values({ projectId, ...fields })
    .returning();

  return created;
}

export async function updateInspection(
  id: string,
  projectId: string,
  fields: InspectionFields,
) {
  const [existing] = await db
    .select({ id: inspectionTable.id })
    .from(inspectionTable)
    .where(
      and(eq(inspectionTable.id, id), eq(inspectionTable.projectId, projectId)),
    );

  if (!existing) {
    throw new HTTPException(404, {
      message: "Inspection doesn't exist in this project",
    });
  }

  await assertReferencesInProject(projectId, fields);

  const updates = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );

  const [updated] = await db
    .update(inspectionTable)
    .set(updates)
    .where(eq(inspectionTable.id, id))
    .returning();

  return updated;
}

export async function deleteInspection(id: string, projectId: string) {
  const [existing] = await db
    .select()
    .from(inspectionTable)
    .where(
      and(eq(inspectionTable.id, id), eq(inspectionTable.projectId, projectId)),
    );

  if (!existing) {
    throw new HTTPException(404, {
      message: "Inspection doesn't exist in this project",
    });
  }

  await db.delete(inspectionTable).where(eq(inspectionTable.id, id));

  return existing;
}
