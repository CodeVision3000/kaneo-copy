import { useMutation, useQueryClient } from "@tanstack/react-query";
import importGridAssets, {
  type ImportGridAssetsRequest,
} from "@/fetchers/grid-asset/import-grid-assets";

function useImportGridAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      assets,
    }: {
      projectId: string;
      assets: ImportGridAssetsRequest;
    }) => importGridAssets(projectId, assets),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["grid-assets", variables.projectId],
      });
      // Import creates circuits on demand.
      void queryClient.invalidateQueries({
        queryKey: ["circuits", variables.projectId],
      });
    },
  });
}

export default useImportGridAssets;
