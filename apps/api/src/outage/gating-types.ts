/**
 * A hot line tag is not literally an outage, but it constrains work the same way and
 * is requested through the same process, so it lives in the same table.
 */
export const OUTAGE_TYPES = [
  "planned_outage",
  "clearance",
  "switching_order",
  "hot_line_tag",
  "energization",
] as const;

export type OutageType = (typeof OUTAGE_TYPES)[number];

/**
 * draft -> requested -> approved -> active -> released is the happy path.
 * denied and cancelled are terminal.
 */
export const OUTAGE_STATUSES = [
  "draft",
  "requested",
  "approved",
  "denied",
  "active",
  "released",
  "cancelled",
] as const;

export type OutageStatus = (typeof OUTAGE_STATUSES)[number];

/** Statuses where the clearance is in hand, so gated work may proceed. */
export const OUTAGE_STATUSES_PERMITTING_WORK = ["active"] as const;

export const PERMIT_TYPES = [
  "row_access",
  "road_opening",
  "dot",
  "railroad",
  "swppp",
  "wetlands",
  "environmental",
  "municipal",
  "other",
] as const;

export type PermitType = (typeof PERMIT_TYPES)[number];

export const PERMIT_STATUSES = [
  "not_required",
  "pending",
  "applied",
  "issued",
  "expired",
  "denied",
] as const;

export type PermitStatus = (typeof PERMIT_STATUSES)[number];

export const INSPECTION_TYPES = [
  "rebar",
  "concrete_pour",
  "torque",
  "grounding",
  "megger",
  "hipot",
  "relay_functional",
  "ct_ratio",
  "oil_sample",
  "punchlist",
  "final",
] as const;

export type InspectionType = (typeof INSPECTION_TYPES)[number];

export const INSPECTION_STATUSES = [
  "pending",
  "scheduled",
  "passed",
  "failed",
  "waived",
] as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

/**
 * Statuses that satisfy a hold point. "waived" counts: the utility or engineer of
 * record can sign off a hold point without a physical inspection, and that decision
 * needs to unblock the work.
 */
export const INSPECTION_STATUSES_SATISFYING_HOLD = [
  "passed",
  "waived",
] as const;
