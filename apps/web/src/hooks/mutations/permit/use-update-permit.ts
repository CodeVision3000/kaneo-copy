import { useMutation, useQueryClient } from "@tanstack/react-query";
import updatePermit, {
  type UpdatePermitRequest,
} from "@/fetchers/permit/update-permit";

function useUpdatePermit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdatePermitRequest) => updatePermit(request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["permits", variables.projectId],
      });
    },
  });
}

export default useUpdatePermit;
