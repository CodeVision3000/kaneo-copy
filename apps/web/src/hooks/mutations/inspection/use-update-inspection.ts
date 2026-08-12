import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateInspection, {
  type UpdateInspectionRequest,
} from "@/fetchers/inspection/update-inspection";

function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateInspectionRequest) => updateInspection(request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["inspections", variables.projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["tasks", variables.projectId],
      });
    },
  });
}

export default useUpdateInspection;
