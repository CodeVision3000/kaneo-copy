import db from "../../database";
import { columnTable, projectTable } from "../../database/schema";

// The utility construction workflow. Work is scheduled, cleared for construction once
// materials/permits/clearance are secured, built, gated on a switching clearance and an
// inspection hold point, then closed out and finally energized.
//
// Note "planned" is deliberately absent: it is a virtual status used as the backlog
// (see task/validate-task-fields.ts), so a column may not claim that slug.
export const DEFAULT_PROJECT_COLUMNS = [
  { name: "Scheduled", slug: "scheduled", position: 0, isFinal: false },
  { name: "Ready to Build", slug: "ready", position: 1, isFinal: false },
  { name: "In Progress", slug: "in-progress", position: 2, isFinal: false },
  {
    name: "Awaiting Clearance",
    slug: "awaiting-clearance",
    position: 3,
    isFinal: false,
  },
  {
    name: "Awaiting Inspection",
    slug: "awaiting-inspection",
    position: 4,
    isFinal: false,
  },
  { name: "Complete", slug: "complete", position: 5, isFinal: false },
  { name: "Energized", slug: "energized", position: 6, isFinal: true },
] as const;

export type CreateProjectInput = {
  workspaceId: string;
  name: string;
  icon: string;
  slug: string;
  discipline?: string | null;
  utilityClient?: string | null;
  contractNumber?: string | null;
  workOrderNumber?: string | null;
  contractType?: string | null;
  voltageKv?: string | null;
};

async function createProject({
  workspaceId,
  name,
  icon,
  slug,
  ...utility
}: CreateProjectInput) {
  return db.transaction(async (tx) => {
    const [createdProject] = await tx
      .insert(projectTable)
      .values({
        workspaceId,
        name,
        icon,
        slug,
        ...utility,
      })
      .returning();

    if (createdProject) {
      for (const col of DEFAULT_PROJECT_COLUMNS) {
        await tx.insert(columnTable).values({
          projectId: createdProject.id,
          name: col.name,
          slug: col.slug,
          position: col.position,
          isFinal: col.isFinal,
        });
      }
    }

    return createdProject;
  });
}

export default createProject;
