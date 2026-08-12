// Mirrors apps/api/src/outage/gating-types.ts. Kept in sync by
// tests/api/outage/gating-parity.test.ts.

export const OUTAGE_TYPES = [
  "planned_outage",
  "clearance",
  "switching_order",
  "hot_line_tag",
  "energization",
] as const;

export type OutageType = (typeof OUTAGE_TYPES)[number];

export const OUTAGE_TYPE_LABELS: Record<OutageType, string> = {
  planned_outage: "Planned Outage",
  clearance: "Clearance",
  switching_order: "Switching Order",
  hot_line_tag: "Hot Line Tag",
  energization: "Energization",
};

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

export const OUTAGE_STATUS_LABELS: Record<OutageStatus, string> = {
  draft: "Draft",
  requested: "Requested",
  approved: "Approved",
  denied: "Denied",
  active: "Active",
  released: "Released",
  cancelled: "Cancelled",
};

/** Badge tone per status. Denied and cancelled read as problems; active is live work. */
export const OUTAGE_STATUS_TONES: Record<
  OutageStatus,
  "secondary" | "info" | "success" | "warning" | "error"
> = {
  draft: "secondary",
  requested: "warning",
  approved: "info",
  denied: "error",
  active: "success",
  released: "secondary",
  cancelled: "error",
};

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

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  row_access: "ROW Access",
  road_opening: "Road Opening",
  dot: "DOT",
  railroad: "Railroad",
  swppp: "SWPPP",
  wetlands: "Wetlands",
  environmental: "Environmental",
  municipal: "Municipal",
  other: "Other",
};

export const PERMIT_STATUSES = [
  "not_required",
  "pending",
  "applied",
  "issued",
  "expired",
  "denied",
] as const;

export type PermitStatus = (typeof PERMIT_STATUSES)[number];

export const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  not_required: "Not Required",
  pending: "Pending",
  applied: "Applied",
  issued: "Issued",
  expired: "Expired",
  denied: "Denied",
};

export const PERMIT_STATUS_TONES: Record<
  PermitStatus,
  "secondary" | "info" | "success" | "warning" | "error"
> = {
  not_required: "secondary",
  pending: "warning",
  applied: "info",
  issued: "success",
  expired: "error",
  denied: "error",
};

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

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  rebar: "Rebar",
  concrete_pour: "Concrete Pour",
  torque: "Torque",
  grounding: "Grounding",
  megger: "Megger",
  hipot: "Hipot",
  relay_functional: "Relay Functional",
  ct_ratio: "CT Ratio",
  oil_sample: "Oil Sample",
  punchlist: "Punchlist",
  final: "Final",
};

export const INSPECTION_STATUSES = [
  "pending",
  "scheduled",
  "passed",
  "failed",
  "waived",
] as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  passed: "Passed",
  failed: "Failed",
  waived: "Waived",
};

export const INSPECTION_STATUS_TONES: Record<
  InspectionStatus,
  "secondary" | "info" | "success" | "warning" | "error"
> = {
  pending: "warning",
  scheduled: "info",
  passed: "success",
  failed: "error",
  waived: "secondary",
};

/** Statuses that satisfy a hold point, matching the API's enforcement. */
export const INSPECTION_STATUSES_SATISFYING_HOLD = [
  "passed",
  "waived",
] as const;

export const TASK_HOLD_REASONS = [
  "weather",
  "materials",
  "permits",
  "clearance",
  "engineering",
  "customer",
  "labor",
  "equipment",
  "environmental",
] as const;

export type TaskHoldReason = (typeof TASK_HOLD_REASONS)[number];

export const TASK_HOLD_REASON_LABELS: Record<TaskHoldReason, string> = {
  weather: "Weather",
  materials: "Materials",
  permits: "Permits",
  clearance: "Clearance",
  engineering: "Engineering",
  customer: "Customer",
  labor: "Labor",
  equipment: "Equipment",
  environmental: "Environmental",
};
