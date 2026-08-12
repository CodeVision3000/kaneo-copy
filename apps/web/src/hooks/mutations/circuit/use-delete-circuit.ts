import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteCircuit from "@/fetchers/circuit/delete-circuit";

function useDeleteCircuit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, id }: { projectId: string; id: string }) =>
      deleteCircuit(projectId, id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["circuits", variables.projectId],
      });
      // Assets on the circuit survive but lose their circuit link.
      void queryClient.invalidateQueries({
        queryKey: ["grid-assets", variables.projectId],
      });
    },
  });
}

export default useDeleteCircuit;
