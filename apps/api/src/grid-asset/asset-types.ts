/**
 * The kinds of physical position work is performed at. One table covers all three
 * disciplines because the lifecycle is identical -- only the vocabulary differs.
 *
 *  structure             transmission/distribution pole or tower
 *  span                  the conductor run between two structures
 *  bay                   a substation position (line bay, transformer bay)
 *  equipment             a discrete device: transformer, breaker, switch, regulator
 *  foundation            a caisson, pier, or pad
 *  duct_bank             underground conduit run
 *  vault                 underground splice or pulling vault
 *  work_order_location   a distribution work-order site keyed by pole number
 */
export const GRID_ASSET_TYPES = [
  "structure",
  "span",
  "bay",
  "equipment",
  "foundation",
  "duct_bank",
  "vault",
  "work_order_location",
] as const;

export type GridAssetType = (typeof GRID_ASSET_TYPES)[number];

export const CIRCUIT_TYPES = [
  "transmission_line",
  "distribution_feeder",
  "substation_bus",
] as const;

export type CircuitType = (typeof CIRCUIT_TYPES)[number];
