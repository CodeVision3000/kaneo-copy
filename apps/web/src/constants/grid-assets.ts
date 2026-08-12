import {
  Building2,
  CircuitBoard,
  Cog,
  Layers,
  Link2,
  Package,
  Radio,
  Zap,
} from "lucide-react";

// Mirrors GRID_ASSET_TYPES in apps/api/src/grid-asset/asset-types.ts.
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

export const GRID_ASSET_TYPE_LABELS: Record<GridAssetType, string> = {
  structure: "Structure",
  span: "Span",
  bay: "Bay",
  equipment: "Equipment",
  foundation: "Foundation",
  duct_bank: "Duct Bank",
  vault: "Vault",
  work_order_location: "Work Order Location",
};

export const GRID_ASSET_TYPE_ICONS: Record<GridAssetType, typeof CircuitBoard> =
  {
    structure: Radio,
    span: Link2,
    bay: Building2,
    equipment: Cog,
    foundation: Layers,
    duct_bank: CircuitBoard,
    vault: Package,
    work_order_location: Zap,
  };

// Mirrors CIRCUIT_TYPES in apps/api/src/grid-asset/asset-types.ts.
export const CIRCUIT_TYPES = [
  "transmission_line",
  "distribution_feeder",
  "substation_bus",
] as const;

export type CircuitType = (typeof CIRCUIT_TYPES)[number];

export const CIRCUIT_TYPE_LABELS: Record<CircuitType, string> = {
  transmission_line: "Transmission Line",
  distribution_feeder: "Distribution Feeder",
  substation_bus: "Substation Bus",
};

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
