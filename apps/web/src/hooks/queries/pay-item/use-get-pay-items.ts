import { useQuery } from "@tanstack/react-query";
import getPayItems from "@/fetchers/pay-item/get-pay-items";

export function useGetPayItems(projectId: string) {
  return useQuery({
    queryKey: ["pay-items", projectId],
    queryFn: () => getPayItems(projectId),
    enabled: !!projectId,
  });
}

export default useGetPayItems;
