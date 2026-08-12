import { useMutation, useQueryClient } from "@tanstack/react-query";
import importConstructionUnits, {
  type ImportConstructionUnitsRequest,
} from "@/fetchers/construction-unit/import-construction-units";

function useImportConstructionUnits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      units,
    }: {
      workspaceId: string;
      units: ImportConstructionUnitsRequest;
    }) => importConstructionUnits(workspaceId, units),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["construction-units", variables.workspaceId],
      });
    },
  });
}

export default useImportConstructionUnits;
