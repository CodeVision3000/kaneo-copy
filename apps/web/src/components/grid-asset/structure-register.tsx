import { MapPin, Plus, Radio, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GRID_ASSET_TYPE_ICONS,
  GRID_ASSET_TYPE_LABELS,
  GRID_ASSET_TYPES,
  type GridAssetType,
} from "@/constants/grid-assets";
import useGetCircuits from "@/hooks/queries/circuit/use-get-circuits";
import useGetGridAssets from "@/hooks/queries/grid-asset/use-get-grid-assets";
import GridAssetFormModal from "./grid-asset-form-modal";
import ImportGridAssetsModal from "./import-grid-assets-modal";

type StructureRegisterProps = {
  projectId: string;
};

const ALL = "all";

/**
 * The work-breakdown spine: every structure, span, bay, and piece of equipment on the
 * project, ordered the way the line is walked, with a progress bar per asset driven by
 * the tasks attached to it.
 */
export default function StructureRegister({
  projectId,
}: StructureRegisterProps) {
  const [assetType, setAssetType] = useState<GridAssetType | typeof ALL>(ALL);
  const [circuitId, setCircuitId] = useState<string>(ALL);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { data: circuits } = useGetCircuits(projectId);
  const {
    data: assets,
    isLoading,
    isError,
  } = useGetGridAssets(projectId, {
    assetType: assetType === ALL ? undefined : assetType,
    circuitId: circuitId === ALL ? undefined : circuitId,
  });

  const totals = useMemo(() => {
    if (!assets?.length) return null;

    const taskCount = assets.reduce((sum, a) => sum + (a.taskCount ?? 0), 0);
    const done = assets.reduce(
      (sum, a) => sum + (a.completedTaskCount ?? 0),
      0,
    );

    return {
      assets: assets.length,
      taskCount,
      completionPercentage:
        taskCount > 0 ? Math.round((done / taskCount) * 100) : 0,
    };
  }, [assets]);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={assetType}
          onValueChange={(value) => {
            if (typeof value === "string" && value) {
              setAssetType(value as GridAssetType | typeof ALL);
            }
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-[190px]">
            <SelectValue>
              {assetType === ALL
                ? "All asset types"
                : GRID_ASSET_TYPE_LABELS[assetType]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All asset types</SelectItem>
            {GRID_ASSET_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {GRID_ASSET_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={circuitId}
          onValueChange={(value) => {
            if (typeof value === "string" && value) {
              setCircuitId(value);
            }
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-[190px]">
            <SelectValue>
              {circuitId === ALL
                ? "All circuits"
                : (circuits?.find((c) => c.id === circuitId)?.designation ??
                  "All circuits")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All circuits</SelectItem>
            {circuits?.map((circuit) => (
              <SelectItem key={circuit.id} value={circuit.id}>
                {circuit.designation}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {totals && (
          <span className="text-muted-foreground text-xs">
            {totals.assets} assets · {totals.taskCount} tasks ·{" "}
            {totals.completionPercentage}% complete
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload className="size-3.5" />
            Import
          </Button>
          <Button
            size="xs"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="size-3.5" />
            Add asset
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">Seq</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Circuit</TableHead>
              <TableHead>kV</TableHead>
              <TableHead>Station</TableHead>
              <TableHead className="w-[180px]">Progress</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  Loading assets…
                </TableCell>
              </TableRow>
            )}

            {isError && (
              <TableRow>
                <TableCell colSpan={8} className="text-destructive-foreground">
                  Couldn't load the structure register.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && assets?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Radio className="size-6 text-muted-foreground" />
                    <p className="font-medium text-sm">No assets yet</p>
                    <p className="max-w-sm text-muted-foreground text-xs">
                      Import a structure list to populate the register, or add
                      assets one at a time.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {assets?.map((asset) => {
              const type = asset.assetType as GridAssetType;
              const Icon = GRID_ASSET_TYPE_ICONS[type] ?? Radio;
              const percentage = asset.completionPercentage ?? 0;

              return (
                <TableRow key={asset.id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {asset.sequence ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-1.5">
                      <Icon className="size-3.5 text-muted-foreground" />
                      {asset.designation}
                    </span>
                    {asset.description && (
                      <span className="mt-0.5 block text-muted-foreground text-xs">
                        {asset.description}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {GRID_ASSET_TYPE_LABELS[type] ?? asset.assetType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {asset.circuitDesignation ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {asset.voltageKv ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {asset.stationing ?? "—"}
                  </TableCell>
                  <TableCell>
                    {asset.taskCount ? (
                      <span className="flex items-center gap-2">
                        <Progress value={percentage} className="h-1.5" />
                        <span className="w-16 shrink-0 text-muted-foreground text-xs">
                          {asset.completedTaskCount}/{asset.taskCount}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        No tasks
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {asset.latitude && asset.longitude && (
                      <span
                        role="img"
                        title={`${asset.latitude}, ${asset.longitude}`}
                        aria-label={`Coordinates ${asset.latitude}, ${asset.longitude}`}
                      >
                        <MapPin className="size-3.5 text-muted-foreground" />
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <GridAssetFormModal
        projectId={projectId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
      <ImportGridAssetsModal
        projectId={projectId}
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
    </div>
  );
}
