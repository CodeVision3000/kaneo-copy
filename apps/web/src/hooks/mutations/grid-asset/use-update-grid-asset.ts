import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateGridAsset, {
  type UpdateGridAssetRequest,
} from "@/fetchers/grid-asset/update-grid-asset";

function useUpdateGridAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateGridAssetRequest) => updateGridAsset(request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["grid-assets", variables.projectId],
      });
    },
  });
}

export default useUpdateGridAsset;
