import { useQuery } from "@tanstack/react-query";
import getCircuits from "@/fetchers/circuit/get-circuits";

export function useGetCircuits(projectId: string) {
  return useQuery({
    queryKey: ["circuits", projectId],
    queryFn: () => getCircuits(projectId),
    enabled: !!projectId,
  });
}

export default useGetCircuits;
