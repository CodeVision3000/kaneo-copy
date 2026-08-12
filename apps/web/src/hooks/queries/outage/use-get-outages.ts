import { useQuery } from "@tanstack/react-query";
import getOutages from "@/fetchers/outage/get-outages";

export function useGetOutages(projectId: string) {
  return useQuery({
    queryKey: ["outages", projectId],
    queryFn: () => getOutages(projectId),
    enabled: !!projectId,
  });
}

export default useGetOutages;
