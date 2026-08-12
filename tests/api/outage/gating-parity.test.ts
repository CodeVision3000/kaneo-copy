import { describe, expect, it } from "vitest";
import {
  INSPECTION_STATUSES,
  INSPECTION_STATUSES_SATISFYING_HOLD,
  INSPECTION_TYPES,
  OUTAGE_STATUSES,
  OUTAGE_TYPES,
  PERMIT_STATUSES,
  PERMIT_TYPES,
} from "../../../apps/api/src/outage/gating-types";
import { TASK_HOLD_REASONS } from "../../../apps/api/src/project/disciplines";
import {
  INSPECTION_TYPE_LABELS,
  OUTAGE_STATUS_LABELS,
  OUTAGE_TYPE_LABELS,
  PERMIT_STATUS_LABELS,
  PERMIT_TYPE_LABELS,
  TASK_HOLD_REASON_LABELS,
  TASK_HOLD_REASONS as WEB_HOLD_REASONS,
  INSPECTION_STATUSES as WEB_INSPECTION_STATUSES,
  INSPECTION_TYPES as WEB_INSPECTION_TYPES,
  OUTAGE_STATUSES as WEB_OUTAGE_STATUSES,
  OUTAGE_TYPES as WEB_OUTAGE_TYPES,
  PERMIT_STATUSES as WEB_PERMIT_STATUSES,
  PERMIT_TYPES as WEB_PERMIT_TYPES,
  INSPECTION_STATUSES_SATISFYING_HOLD as WEB_SATISFYING,
} from "../../../apps/web/src/constants/gating";

/**
 * The API validates these with valibot picklists and the web app builds its dropdowns
 * from its own copy. Drift means the UI can offer a value the API rejects, so the two
 * lists are pinned together here.
 */
describe("gating vocabulary parity", () => {
  const pairs = [
    ["outage types", OUTAGE_TYPES, WEB_OUTAGE_TYPES],
    ["outage statuses", OUTAGE_STATUSES, WEB_OUTAGE_STATUSES],
    ["permit types", PERMIT_TYPES, WEB_PERMIT_TYPES],
    ["permit statuses", PERMIT_STATUSES, WEB_PERMIT_STATUSES],
    ["inspection types", INSPECTION_TYPES, WEB_INSPECTION_TYPES],
    ["inspection statuses", INSPECTION_STATUSES, WEB_INSPECTION_STATUSES],
    ["hold reasons", TASK_HOLD_REASONS, WEB_HOLD_REASONS],
    [
      "hold-satisfying statuses",
      INSPECTION_STATUSES_SATISFYING_HOLD,
      WEB_SATISFYING,
    ],
  ] as const;

  for (const [name, api, web] of pairs) {
    it(`${name} match between api and web`, () => {
      expect([...web]).toEqual([...api]);
    });
  }

  const labelMaps = [
    ["outage types", OUTAGE_TYPES, OUTAGE_TYPE_LABELS],
    ["outage statuses", OUTAGE_STATUSES, OUTAGE_STATUS_LABELS],
    ["permit types", PERMIT_TYPES, PERMIT_TYPE_LABELS],
    ["permit statuses", PERMIT_STATUSES, PERMIT_STATUS_LABELS],
    ["inspection types", INSPECTION_TYPES, INSPECTION_TYPE_LABELS],
    ["hold reasons", TASK_HOLD_REASONS, TASK_HOLD_REASON_LABELS],
  ] as const;

  for (const [name, values, labels] of labelMaps) {
    it(`every ${name} value has a display label`, () => {
      for (const value of values) {
        expect(labels[value as keyof typeof labels]).toBeTruthy();
      }
    });
  }
});

describe("hold point semantics", () => {
  it("counts a waiver as satisfying a hold point", () => {
    // The engineer of record can sign off without a physical inspection, and that
    // decision has to unblock the work.
    expect(INSPECTION_STATUSES_SATISFYING_HOLD).toContain("waived");
  });

  it("does not let a failed inspection satisfy a hold point", () => {
    expect(INSPECTION_STATUSES_SATISFYING_HOLD).not.toContain("failed");
    expect(INSPECTION_STATUSES_SATISFYING_HOLD).not.toContain("pending");
    expect(INSPECTION_STATUSES_SATISFYING_HOLD).not.toContain("scheduled");
  });
});
