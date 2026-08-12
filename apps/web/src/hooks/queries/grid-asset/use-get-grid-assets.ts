import { useQuery } from "@tanstack/react-query";
import getGridAssets, {
  type GridAssetFilters,
} from "@/fetchers/grid-asset/get-grid-assets";

export function useGetGridAssets(
  projectId: string,
  filters: GridAssetFilters = {},
) {
  return useQuery({
    queryKey: ["grid-assets", projectId, filters.assetType, filters.circuitId],
    queryFn: () => getGridAssets(projectId, filters),
    enabled: !!projectId,
  });
}

export default useGetGridAssets;
