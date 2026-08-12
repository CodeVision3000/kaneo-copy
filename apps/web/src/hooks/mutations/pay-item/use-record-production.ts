import { useMutation, useQueryClient } from "@tanstack/react-query";
import recordProduction, {
  type RecordProductionRequest,
} from "@/fetchers/pay-item/record-production";

function useRecordProduction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RecordProductionRequest) => recordProduction(request),
    onSuccess: (_data, variables) => {
      // Booking production moves both the installed quantities and the rollup.
      for (const key of ["pay-items", "earned-value", "production"]) {
        void queryClient.invalidateQueries({
          queryKey: [key, variables.projectId],
        });
      }
    },
  });
}

export default useRecordProduction;
