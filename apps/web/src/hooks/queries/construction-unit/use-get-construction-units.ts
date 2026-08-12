import { useQuery } from "@tanstack/react-query";
import getConstructionUnits from "@/fetchers/construction-unit/get-construction-units";

export function useGetConstructionUnits(workspaceId: string) {
  return useQuery({
    queryKey: ["construction-units", workspaceId],
    queryFn: () => getConstructionUnits(workspaceId),
    enabled: !!workspaceId,
  });
}

export default useGetConstructionUnits;
