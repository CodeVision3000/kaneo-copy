import { describe, expect, it } from "vitest";
import {
  CIRCUIT_TYPES,
  GRID_ASSET_TYPES,
} from "../../../apps/api/src/grid-asset/asset-types";
import {
  CIRCUIT_TYPES as WEB_CIRCUIT_TYPES,
  GRID_ASSET_TYPES as WEB_GRID_ASSET_TYPES,
} from "../../../apps/web/src/constants/grid-assets";

/**
 * The API validates asset types with a valibot picklist and the web app builds its
 * dropdowns from a separate constant. They are duplicated by necessity (different
 * packages) so this pins them together -- a drift here means the UI can offer a type the
 * API rejects.
 */
describe("grid asset type parity", () => {
  it("asset types match between api and web", () => {
    expect([...WEB_GRID_ASSET_TYPES]).toEqual([...GRID_ASSET_TYPES]);
  });

  it("circuit types match between api and web", () => {
    expect([...WEB_CIRCUIT_TYPES]).toEqual([...CIRCUIT_TYPES]);
  });

  it("covers all three disciplines", () => {
    // transmission works structure-by-structure, substation bay-by-bay,
    // distribution by work-order location.
    expect(GRID_ASSET_TYPES).toContain("structure");
    expect(GRID_ASSET_TYPES).toContain("bay");
    expect(GRID_ASSET_TYPES).toContain("work_order_location");
  });
});
