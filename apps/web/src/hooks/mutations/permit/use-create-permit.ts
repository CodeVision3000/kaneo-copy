import { useMutation, useQueryClient } from "@tanstack/react-query";
import createPermit, {
  type CreatePermitRequest,
} from "@/fetchers/permit/create-permit";

function useCreatePermit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreatePermitRequest) => createPermit(request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["permits", variables.projectId],
      });
    },
  });
}

export default useCreatePermit;
