import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteGridAsset from "@/fetchers/grid-asset/delete-grid-asset";

function useDeleteGridAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, id }: { projectId: string; id: string }) =>
      deleteGridAsset(projectId, id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["grid-assets", variables.projectId],
      });
      // Deleting an asset unlinks its tasks, so the board is stale too.
      void queryClient.invalidateQueries({
        queryKey: ["tasks", variables.projectId],
      });
    },
  });
}

export default useDeleteGridAsset;
