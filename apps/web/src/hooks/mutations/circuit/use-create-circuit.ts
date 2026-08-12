import { useMutation, useQueryClient } from "@tanstack/react-query";
import createCircuit, {
  type CreateCircuitRequest,
} from "@/fetchers/circuit/create-circuit";

function useCreateCircuit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateCircuitRequest) => createCircuit(request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["circuits", variables.projectId],
      });
    },
  });
}

export default useCreateCircuit;
