import { useMutation, useQueryClient } from "@tanstack/react-query";
import createInspection, {
  type CreateInspectionRequest,
} from "@/fetchers/inspection/create-inspection";

function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateInspectionRequest) => createInspection(request),
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

export default useCreateInspection;
