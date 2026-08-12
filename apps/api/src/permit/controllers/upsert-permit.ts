import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { gridAssetTable, permitTable } from "../../database/schema";

export type PermitFields = {
  type?: string;
  permitNumber?: string | null;
  description?: string | null;
  issuingAuthority?: string | null;
  status?: string;
  appliedAt?: Date | null;
  issuedAt?: Date | null;
  expiresAt?: Date | null;
  gridAssetId?: string | null;
  notes?: string | null;
};

async function assertAssetInProject(
  projectId: string,
  gridAssetId?: string | null,
) {
  if (!gridAssetId) return;

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

export async function createPermit(
  projectId: string,
  fields: PermitFields & { type: string },
) {
  await assertAssetInProject(projectId, fields.gridAssetId);

  const [created] = await db
    .insert(permitTable)
    .values({ projectId, ...fields })
    .returning();

  return created;
}

export async function updatePermit(
  id: string,
  projectId: string,
  fields: PermitFields,
) {
  const [existing] = await db
    .select({ id: permitTable.id })
    .from(permitTable)
    .where(and(eq(permitTable.id, id), eq(permitTable.projectId, projectId)));

  if (!existing) {
    throw new HTTPException(404, {
      message: "Permit doesn't exist in this project",
    });
  }

  await assertAssetInProject(projectId, fields.gridAssetId);

  const updates = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );

  const [updated] = await db
    .update(permitTable)
    .set(updates)
    .where(eq(permitTable.id, id))
    .returning();

  return updated;
}

export async function deletePermit(id: string, projectId: string) {
  const [existing] = await db
    .select()
    .from(permitTable)
    .where(and(eq(permitTable.id, id), eq(permitTable.projectId, projectId)));

  if (!existing) {
    throw new HTTPException(404, {
      message: "Permit doesn't exist in this project",
    });
  }

  await db.delete(permitTable).where(eq(permitTable.id, id));

  return existing;
}
