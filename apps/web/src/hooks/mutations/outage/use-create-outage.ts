import { useMutation, useQueryClient } from "@tanstack/react-query";
import createOutage, {
  type CreateOutageRequest,
} from "@/fetchers/outage/create-outage";

function useCreateOutage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateOutageRequest) => createOutage(request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["outages", variables.projectId],
      });
    },
  });
}

export default useCreateOutage;
