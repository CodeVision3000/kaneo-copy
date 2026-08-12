import { useMutation, useQueryClient } from "@tanstack/react-query";
import createGridAsset, {
  type CreateGridAssetRequest,
} from "@/fetchers/grid-asset/create-grid-asset";

function useCreateGridAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateGridAssetRequest) => createGridAsset(request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["grid-assets", variables.projectId],
      });
    },
  });
}

export default useCreateGridAsset;
