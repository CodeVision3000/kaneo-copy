import { useMutation, useQueryClient } from "@tanstack/react-query";
import createPayItem, {
  type CreatePayItemRequest,
} from "@/fetchers/pay-item/create-pay-item";

function useCreatePayItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreatePayItemRequest) => createPayItem(request),
    onSuccess: (_data, variables) => {
      for (const key of ["pay-items", "earned-value"]) {
        void queryClient.invalidateQueries({
          queryKey: [key, variables.projectId],
        });
      }
    },
  });
}

export default useCreatePayItem;
