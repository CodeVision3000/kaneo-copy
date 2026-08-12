import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { gridAssetTable } from "../../database/schema";

/**
 * Deleting an asset does not delete its work. Tasks and child assets reference it with
 * "set null", so they survive as project-level items and can be reassigned.
 */
async function deleteGridAsset(id: string, projectId: string) {
  const [existing] = await db
    .select()
    .from(gridAssetTable)
    .where(
      and(eq(gridAssetTable.id, id), eq(gridAssetTable.projectId, projectId)),
    );

  if (!existing) {
    throw new HTTPException(404, {
      message: "Asset doesn't exist in this project",
    });
  }

  await db.delete(gridAssetTable).where(eq(gridAssetTable.id, id));

  return existing;
}

export default deleteGridAsset;
