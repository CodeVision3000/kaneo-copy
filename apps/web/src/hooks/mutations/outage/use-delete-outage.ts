import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteOutage from "@/fetchers/outage/delete-outage";

function useDeleteOutage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, id }: { projectId: string; id: string }) =>
      deleteOutage(projectId, id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["outages", variables.projectId],
      });
    },
  });
}

export default useDeleteOutage;
