import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateOutage, {
  type UpdateOutageRequest,
} from "@/fetchers/outage/update-outage";

function useUpdateOutage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateOutageRequest) => updateOutage(request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["outages", variables.projectId],
      });
    },
  });
}

export default useUpdateOutage;
