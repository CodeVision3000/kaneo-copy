import { useQuery } from "@tanstack/react-query";
import getInspections from "@/fetchers/inspection/get-inspections";

export function useGetInspections(projectId: string, taskId?: string) {
  return useQuery({
    queryKey: ["inspections", projectId, taskId],
    queryFn: () => getInspections(projectId, taskId),
    enabled: !!projectId,
  });
}

export default useGetInspections;
