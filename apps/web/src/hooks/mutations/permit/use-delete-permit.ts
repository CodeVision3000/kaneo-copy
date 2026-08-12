import { useMutation, useQueryClient } from "@tanstack/react-query";
import deletePermit from "@/fetchers/permit/delete-permit";

function useDeletePermit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, id }: { projectId: string; id: string }) =>
      deletePermit(projectId, id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["permits", variables.projectId],
      });
    },
  });
}

export default useDeletePermit;
