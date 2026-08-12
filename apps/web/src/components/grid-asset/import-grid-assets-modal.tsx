import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GRID_ASSET_TYPES } from "@/constants/grid-assets";
import useImportGridAssets from "@/hooks/mutations/grid-asset/use-import-grid-assets";
import { parseGridAssetCsv } from "@/lib/parse-grid-asset-csv";

type ImportGridAssetsModalProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SAMPLE = `designation,assetType,circuitDesignation,sequence,voltageKv,stationing,description
PS-140,structure,Line 1234,10,115,10+00,Tangent steel pole
PS-141,structure,Line 1234,20,115,12+50,Running angle
PS-140-141,span,Line 1234,25,115,,795 ACSR Drake`;

/**
 * Structure registers arrive as spreadsheets, so paste-a-CSV is the primary way a
 * project gets populated. Import matches on designation, which means re-pasting a
 * corrected list updates rows in place instead of duplicating the register.
 */
export default function ImportGridAssetsModal({
  projectId,
  open,
  onOpenChange,
}: ImportGridAssetsModalProps) {
  const [csv, setCsv] = useState("");
  const importGridAssets = useImportGridAssets();

  const handleImport = async () => {
    let assets: ReturnType<typeof parseGridAssetCsv>;

    try {
      assets = parseGridAssetCsv(csv);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't parse that CSV",
      );
      return;
    }

    if (assets.length === 0) {
      toast.error("No rows found");
      return;
    }

    try {
      const result = await importGridAssets.mutateAsync({ projectId, assets });

      const parts = [`${result.created} created`, `${result.updated} updated`];
      if (result.skipped.length > 0) {
        parts.push(`${result.skipped.length} skipped`);
      }
      toast.success(parts.join(", "));

      // Surface why rows were dropped rather than silently reporting success.
      for (const skip of result.skipped.slice(0, 5)) {
        toast.warning(
          `Skipped ${skip.designation || "(blank)"}: ${skip.reason}`,
        );
      }

      setCsv("");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't import the assets",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import structure list</DialogTitle>
          <DialogDescription>
            Paste CSV with a header row. Rows are matched on designation, so
            re-importing a corrected list updates existing assets rather than
            duplicating them. Circuits named here are created if they don't
            exist yet.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="grid-asset-csv">CSV</Label>
            <Textarea
              id="grid-asset-csv"
              value={csv}
              onChange={(event) => setCsv(event.target.value)}
              placeholder={SAMPLE}
              rows={10}
              className="font-mono text-xs"
            />
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-muted-foreground text-xs">
            <p className="font-medium text-foreground">Columns</p>
            <p className="mt-1">
              <span className="font-mono">designation</span> is required.
              Optional:{" "}
              <span className="font-mono">
                assetType, circuitDesignation, sequence, voltageKv, stationing,
                latitude, longitude, description
              </span>
              .
            </p>
            <p className="mt-1.5">
              <span className="font-mono">assetType</span> is one of{" "}
              <span className="font-mono">{GRID_ASSET_TYPES.join(", ")}</span>{" "}
              and defaults to <span className="font-mono">structure</span>.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importGridAssets.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importGridAssets.isPending}>
            {importGridAssets.isPending ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
