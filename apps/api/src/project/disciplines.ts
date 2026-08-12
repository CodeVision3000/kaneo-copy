/**
 * Utility project attributes shared by the schema validators and the controllers.
 *
 * Discipline decides which work-breakdown vocabulary a project uses:
 *  - transmission  overhead lines 69 kV and up; work is per structure and per span
 *  - distribution  4-35 kV; work-order driven against pole numbers on a feeder
 *  - substation    work is per bay / equipment position
 *  - underground   duct bank, vaults, and cable pulls
 */
export const PROJECT_DISCIPLINES = [
  "transmission",
  "distribution",
  "substation",
  "underground",
] as const;

export type ProjectDiscipline = (typeof PROJECT_DISCIPLINES)[number];

/** How the work is paid for, which determines whether pay items drive billing. */
export const CONTRACT_TYPES = [
  "unit_price",
  "lump_sum",
  "time_and_material",
  "cost_plus",
] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number];

/** Standard transmission and distribution voltage classes, in kV. */
export const VOLTAGE_CLASSES_KV = [
  "4.16",
  "13.8",
  "23",
  "34.5",
  "69",
  "115",
  "138",
  "230",
  "345",
  "500",
] as const;

/**
 * Why a task is held. Captured separately from status so reporting can distinguish a
 * weather day from a missing material or an unapproved clearance.
 */
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
