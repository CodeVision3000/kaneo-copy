import { describe, expect, it } from "vitest";
import { DEFAULT_PROJECT_COLUMNS } from "../../../apps/api/src/project/controllers/create-project";
import {
  VALID_PRIORITIES,
  VIRTUAL_STATUSES,
} from "../../../apps/api/src/task/validate-task-fields";
import { TASK_PRIORITIES } from "../../../apps/web/src/constants/priorities";

describe("default utility workflow", () => {
  it("runs scheduled through energized", () => {
    expect(DEFAULT_PROJECT_COLUMNS.map((c) => c.slug)).toEqual([
      "scheduled",
      "ready",
      "in-progress",
      "awaiting-clearance",
      "awaiting-inspection",
      "complete",
      "energized",
    ]);
  });

  it("treats only energization as terminal", () => {
    const final = DEFAULT_PROJECT_COLUMNS.filter((c) => c.isFinal);
    expect(final).toHaveLength(1);
    expect(final[0]?.slug).toBe("energized");
  });

  it("never claims a slug reserved as a virtual status", () => {
    // "planned" backs the backlog and "archived" the archive; a column with either
    // slug would shadow them in getValidTaskStatuses().
    for (const virtual of VIRTUAL_STATUSES) {
      expect(DEFAULT_PROJECT_COLUMNS.map((c) => c.slug)).not.toContain(virtual);
    }
  });

  it("assigns contiguous positions from zero", () => {
    expect(DEFAULT_PROJECT_COLUMNS.map((c) => c.position)).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ]);
  });
});

describe("utility priority ladder", () => {
  it("orders routine through emergency", () => {
    expect([...VALID_PRIORITIES]).toEqual([
      "no-priority",
      "routine",
      "expedited",
      "urgent",
      "emergency",
    ]);
  });

  it("matches the web app's list", () => {
    expect([...TASK_PRIORITIES]).toEqual([...VALID_PRIORITIES]);
  });

  it("shares no value with the default column slugs", () => {
    // Status and priority are different fields, but overlapping vocabulary makes
    // filters and labels ambiguous to read.
    const slugs = new Set(DEFAULT_PROJECT_COLUMNS.map((c) => c.slug));
    for (const priority of VALID_PRIORITIES) {
      expect(slugs.has(priority)).toBe(false);
    }
  });
});
