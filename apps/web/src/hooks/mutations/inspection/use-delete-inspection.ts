import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteInspection from "@/fetchers/inspection/delete-inspection";

function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, id }: { projectId: string; id: string }) =>
      deleteInspection(projectId, id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["inspections", variables.projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["tasks", variables.projectId],
      });
    },
  });
}

export default useDeleteInspection;
