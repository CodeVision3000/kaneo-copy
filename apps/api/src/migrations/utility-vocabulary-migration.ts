import { and, eq, inArray, sql } from "drizzle-orm";
import db from "../database";
import { columnTable, taskTable } from "../database/schema";

/**
 * Moves databases created before the utility rebrand onto the new vocabulary.
 *
 * Kaneo shipped generic columns (to-do / in-progress / in-review / done) and a generic
 * priority ladder (low / medium / high / urgent). SPARC uses the construction workflow
 * and the utility work-order priority ladder instead. Existing rows still carry the old
 * values, and `task.status` stores a column slug, so both have to move together.
 *
 * Both halves are individually guarded so this is safe to run on every startup.
 */

/** Old slug -> new slug and display name. "in-progress" is unchanged, so it is absent. */
const COLUMN_RENAMES = [
  { from: "to-do", to: "scheduled", name: "Scheduled" },
  { from: "in-review", to: "awaiting-inspection", name: "Awaiting Inspection" },
  // "done" was the terminal column, so it becomes the new terminal column.
  { from: "done", to: "energized", name: "Energized" },
] as const;

const LEGACY_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const NEW_ONLY_PRIORITIES = ["routine", "expedited", "emergency"] as const;

async function migrateColumnSlugs(): Promise<number> {
  let renamed = 0;

  for (const rename of COLUMN_RENAMES) {
    const legacyColumns = await db
      .select({ id: columnTable.id, projectId: columnTable.projectId })
      .from(columnTable)
      .where(eq(columnTable.slug, rename.from));

    for (const legacy of legacyColumns) {
      // Don't collide with a column that already owns the target slug.
      const [conflict] = await db
        .select({ id: columnTable.id })
        .from(columnTable)
        .where(
          and(
            eq(columnTable.projectId, legacy.projectId),
            eq(columnTable.slug, rename.to),
          ),
        );

      if (conflict) {
        continue;
      }

      await db
        .update(columnTable)
        .set({ slug: rename.to, name: rename.name })
        .where(eq(columnTable.id, legacy.id));

      // task.status stores the slug, so it has to follow the rename.
      await db
        .update(taskTable)
        .set({ status: rename.to })
        .where(
          and(
            eq(taskTable.projectId, legacy.projectId),
            eq(taskTable.status, rename.from),
          ),
        );

      renamed += 1;
    }
  }

  return renamed;
}

async function migrateTaskPriorities(): Promise<number> {
  // If any row already holds a SPARC-only priority, this database has been migrated.
  // Without this guard a second pass would promote the rows we just wrote to "urgent"
  // on up to "emergency".
  const [alreadyMigrated] = await db
    .select({ id: taskTable.id })
    .from(taskTable)
    .where(inArray(taskTable.priority, [...NEW_ONLY_PRIORITIES]))
    .limit(1);

  if (alreadyMigrated) {
    return 0;
  }

  // One statement so each row is evaluated exactly once. Sequential UPDATEs would
  // cascade: high -> urgent, then that same row urgent -> emergency.
  const result = await db
    .update(taskTable)
    .set({
      priority: sql`CASE ${taskTable.priority}
        WHEN 'urgent' THEN 'emergency'
        WHEN 'high' THEN 'urgent'
        WHEN 'medium' THEN 'expedited'
        WHEN 'low' THEN 'routine'
        ELSE ${taskTable.priority}
      END`,
    })
    .where(inArray(taskTable.priority, [...LEGACY_PRIORITIES]));

  return result.rowCount ?? 0;
}

export async function migrateUtilityVocabulary() {
  const renamedColumns = await migrateColumnSlugs();
  const repricedTasks = await migrateTaskPriorities();

  // Any task still on a legacy slug has no backing column (the rename above covers
  // every task whose project had one). "to-do" is no longer a valid status, so park
  // these in the backlog rather than leaving a value the API would reject.
  const orphaned = await db
    .update(taskTable)
    .set({ status: "planned" })
    .where(inArray(taskTable.status, ["to-do", "in-review", "done"]));

  if (renamedColumns > 0 || repricedTasks > 0 || (orphaned.rowCount ?? 0) > 0) {
    console.log(
      `✅ Utility vocabulary migration: renamed ${renamedColumns} columns, remapped ${repricedTasks} task priorities`,
    );
  }
}
