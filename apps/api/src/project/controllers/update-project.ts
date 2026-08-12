import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";

export type UpdateProjectInput = {
  id: string;
  workspaceId: string;
  name: string;
  icon: string;
  slug: string;
  description: string;
  isPublic: boolean;
  discipline?: string | null;
  utilityClient?: string | null;
  contractNumber?: string | null;
  workOrderNumber?: string | null;
  contractType?: string | null;
  voltageKv?: string | null;
  mobilizationDate?: Date | null;
  energizationTargetDate?: Date | null;
  substantialCompletionDate?: Date | null;
};

async function updateProject({
  id,
  workspaceId,
  name,
  icon,
  slug,
  description,
  isPublic,
  ...utility
}: UpdateProjectInput) {
  const [existingProject] = await db
    .select()
    .from(projectTable)
    .where(
      and(eq(projectTable.id, id), eq(projectTable.workspaceId, workspaceId)),
    );

  const isProjectExisting = Boolean(existingProject);

  if (!isProjectExisting) {
    throw new HTTPException(404, {
      message:
        "Project doesn't exist or doesn't belong to the specified workspace",
    });
  }

  // Only overwrite utility attributes the caller actually sent, so a partial update
  // from one settings tab can't blank out fields owned by another.
  const utilityUpdates = Object.fromEntries(
    Object.entries(utility).filter(([, value]) => value !== undefined),
  );

  const [updatedProject] = await db
    .update(projectTable)
    .set({
      name,
      icon,
      slug,
      description,
      isPublic,
      ...utilityUpdates,
    })
    .where(eq(projectTable.id, id))
    .returning();

  return updatedProject;
}

export default updateProject;
