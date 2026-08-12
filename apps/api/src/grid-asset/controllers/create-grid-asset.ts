import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { circuitTable, gridAssetTable } from "../../database/schema";

export type CreateGridAssetInput = {
  projectId: string;
  designation: string;
  assetType: string;
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

/**
 * Verifies a referenced circuit or parent asset belongs to the same project, so a
 * caller cannot graft one project's structure onto another's line.
 */
export async function assertSameProject(
  projectId: string,
  {
    circuitId,
    parentGridAssetId,
  }: Pick<CreateGridAssetInput, "circuitId" | "parentGridAssetId">,
) {
  if (circuitId) {
    const [circuit] = await db
      .select({ id: circuitTable.id })
      .from(circuitTable)
      .where(
        and(
          eq(circuitTable.id, circuitId),
          eq(circuitTable.projectId, projectId),
        ),
      );

    if (!circuit) {
      throw new HTTPException(400, {
        message: "Circuit doesn't exist in this project",
      });
    }
  }

  if (parentGridAssetId) {
    const [parent] = await db
      .select({ id: gridAssetTable.id })
      .from(gridAssetTable)
      .where(
        and(
          eq(gridAssetTable.id, parentGridAssetId),
          eq(gridAssetTable.projectId, projectId),
        ),
      );

    if (!parent) {
      throw new HTTPException(400, {
        message: "Parent asset doesn't exist in this project",
      });
    }
  }
}

async function createGridAsset({ projectId, ...fields }: CreateGridAssetInput) {
  await assertSameProject(projectId, fields);

  const [existing] = await db
    .select({ id: gridAssetTable.id })
    .from(gridAssetTable)
    .where(
      and(
        eq(gridAssetTable.projectId, projectId),
        eq(gridAssetTable.designation, fields.designation),
      ),
    );

  if (existing) {
    throw new HTTPException(409, {
      message: `An asset designated "${fields.designation}" already exists in this project`,
    });
  }

  const [created] = await db
    .insert(gridAssetTable)
    .values({ projectId, ...fields })
    .returning();

  return created;
}

export default createGridAsset;
