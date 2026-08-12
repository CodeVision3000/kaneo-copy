import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateCircuit, {
  type UpdateCircuitRequest,
} from "@/fetchers/circuit/update-circuit";

function useUpdateCircuit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateCircuitRequest) => updateCircuit(request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["circuits", variables.projectId],
      });
      // The register shows each asset's circuit designation.
      void queryClient.invalidateQueries({
        queryKey: ["grid-assets", variables.projectId],
      });
    },
  });
}

export default useUpdateCircuit;
