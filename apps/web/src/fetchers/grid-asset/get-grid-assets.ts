import { client } from "@kaneo/libs";
import type { GridAssetType } from "@/constants/grid-assets";

export type GridAssetFilters = {
  assetType?: GridAssetType;
  circuitId?: string;
};

async function getGridAssets(
  projectId: string,
  filters: GridAssetFilters = {},
) {
  const response = await client["grid-asset"][":projectId"].$get({
    param: { projectId },
    query: filters,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

export default getGridAssets;
