import { and, eq, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { gridAssetTable } from "../../database/schema";
import { assertSameProject } from "./create-grid-asset";

export type UpdateGridAssetInput = {
  id: string;
  projectId: string;
  designation?: string;
  assetType?: string;
  circuitId?: string | null;
  parentGridAssetId?: string | null;
  description?: string | null;
  sequence?: number | null;
  latitude?: string | null;
  longitude?: string | null;
  stationing?: string | null;
  voltageKv?: string | null;
  attributes?: unknown;
};

async function updateGridAsset({
  id,
  projectId,
  ...fields
}: UpdateGridAssetInput) {
  const [existing] = await db
    .select({ id: gridAssetTable.id })
    .from(gridAssetTable)
    .where(
      and(eq(gridAssetTable.id, id), eq(gridAssetTable.projectId, projectId)),
    );

  if (!existing) {
    throw new HTTPException(404, {
      message: "Asset doesn't exist in this project",
    });
  }

  if (fields.parentGridAssetId === id) {
    throw new HTTPException(400, {
      message: "An asset can't be its own parent",
    });
  }

  await assertSameProject(projectId, fields);

  if (fields.designation) {
    const [conflict] = await db
      .select({ id: gridAssetTable.id })
      .from(gridAssetTable)
      .where(
        and(
          eq(gridAssetTable.projectId, projectId),
          eq(gridAssetTable.designation, fields.designation),
          ne(gridAssetTable.id, id),
        ),
      );

    if (conflict) {
      throw new HTTPException(409, {
        message: `An asset designated "${fields.designation}" already exists in this project`,
      });
    }
  }

  // Absent keys leave the stored value alone; an explicit null clears it.
  const updates = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );

  const [updated] = await db
    .update(gridAssetTable)
    .set(updates)
    .where(eq(gridAssetTable.id, id))
    .returning();

  return updated;
}

export default updateGridAsset;
