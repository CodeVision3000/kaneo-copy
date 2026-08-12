/** Utilities price install, remove, and transfer of the same unit differently. */
export const PAY_ITEM_ACTIONS = [
  "install",
  "remove",
  "transfer",
  "relocate",
] as const;

export type PayItemAction = (typeof PAY_ITEM_ACTIONS)[number];

export const UNITS_OF_MEASURE = ["EA", "LF", "CY", "TON", "HR", "LS"] as const;

export type UnitOfMeasure = (typeof UNITS_OF_MEASURE)[number];

export const CREW_TYPES = [
  "line",
  "substation",
  "civil",
  "underground",
  "test",
  "support",
] as const;

export type CrewType = (typeof CREW_TYPES)[number];

export const CREW_CLASSIFICATIONS = [
  "foreman",
  "journeyman",
  "apprentice",
  "groundman",
  "operator",
  "technician",
] as const;

export type CrewClassification = (typeof CREW_CLASSIFICATIONS)[number];

export const EQUIPMENT_TYPES = [
  "digger_derrick",
  "bucket",
  "crane",
  "puller",
  "tensioner",
  "pickup",
  "trailer",
  "dozer",
  "excavator",
  "other",
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const DAILY_REPORT_STATUSES = [
  "draft",
  "submitted",
  "approved",
] as const;

export type DailyReportStatus = (typeof DAILY_REPORT_STATUSES)[number];

/**
 * Quantities, hours, and prices are stored as text so exact decimals survive without
 * binary float error. This validates a value is a usable non-negative decimal before it
 * reaches the database, where it would otherwise fail a ::numeric cast at read time.
 */
export function isDecimalString(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value.trim());
}
