import { useQuery } from "@tanstack/react-query";
import getPermits from "@/fetchers/permit/get-permits";

export function useGetPermits(projectId: string) {
  return useQuery({
    queryKey: ["permits", projectId],
    queryFn: () => getPermits(projectId),
    enabled: !!projectId,
  });
}

export default useGetPermits;
