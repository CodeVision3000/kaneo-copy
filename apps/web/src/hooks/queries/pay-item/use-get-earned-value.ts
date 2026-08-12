import { useQuery } from "@tanstack/react-query";
import getEarnedValue from "@/fetchers/pay-item/get-earned-value";

export function useGetEarnedValue(projectId: string) {
  return useQuery({
    queryKey: ["earned-value", projectId],
    queryFn: () => getEarnedValue(projectId),
    enabled: !!projectId,
  });
}

export default useGetEarnedValue;
