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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GRID_ASSET_TYPE_LABELS,
  GRID_ASSET_TYPES,
  type GridAssetType,
  VOLTAGE_CLASSES_KV,
} from "@/constants/grid-assets";
import useCreateGridAsset from "@/hooks/mutations/grid-asset/use-create-grid-asset";
import useGetCircuits from "@/hooks/queries/circuit/use-get-circuits";

type GridAssetFormModalProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NONE = "none";

export default function GridAssetFormModal({
  projectId,
  open,
  onOpenChange,
}: GridAssetFormModalProps) {
  const [designation, setDesignation] = useState("");
  const [assetType, setAssetType] = useState<GridAssetType>("structure");
  const [circuitId, setCircuitId] = useState(NONE);
  const [voltageKv, setVoltageKv] = useState(NONE);
  const [sequence, setSequence] = useState("");
  const [stationing, setStationing] = useState("");
  const [description, setDescription] = useState("");

  const { data: circuits } = useGetCircuits(projectId);
  const createGridAsset = useCreateGridAsset();

  const reset = () => {
    setDesignation("");
    setAssetType("structure");
    setCircuitId(NONE);
    setVoltageKv(NONE);
    setSequence("");
    setStationing("");
    setDescription("");
  };

  const handleSubmit = async () => {
    const trimmed = designation.trim();

    if (!trimmed) {
      toast.error("A designation is required");
      return;
    }

    const parsedSequence = sequence.trim() ? Number(sequence) : null;

    if (parsedSequence !== null && Number.isNaN(parsedSequence)) {
      toast.error("Sequence must be a number");
      return;
    }

    try {
      await createGridAsset.mutateAsync({
        projectId,
        designation: trimmed,
        assetType,
        circuitId: circuitId === NONE ? null : circuitId,
        voltageKv: voltageKv === NONE ? null : voltageKv,
        sequence: parsedSequence,
        stationing: stationing.trim() || null,
        description: description.trim() || null,
      });

      toast.success(`Added ${trimmed}`);
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't add the asset",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add grid asset</DialogTitle>
          <DialogDescription>
            A structure, span, bay, or piece of equipment that work hangs off.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="grid-asset-designation">Designation</Label>
            <Input
              id="grid-asset-designation"
              value={designation}
              onChange={(event) => setDesignation(event.target.value)}
              placeholder="PS-142"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Asset type</Label>
            <Select
              value={assetType}
              onValueChange={(value) => {
                if (typeof value === "string" && value) {
                  setAssetType(value as GridAssetType);
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue>{GRID_ASSET_TYPE_LABELS[assetType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {GRID_ASSET_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {GRID_ASSET_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Circuit</Label>
            <Select
              value={circuitId}
              onValueChange={(value) => {
                if (typeof value === "string" && value) {
                  setCircuitId(value);
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {circuitId === NONE
                    ? "None"
                    : (circuits?.find((c) => c.id === circuitId)?.designation ??
                      "None")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {circuits?.map((circuit) => (
                  <SelectItem key={circuit.id} value={circuit.id}>
                    {circuit.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Voltage class (kV)</Label>
            <Select
              value={voltageKv}
              onValueChange={(value) => {
                if (typeof value === "string" && value) {
                  setVoltageKv(value);
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {voltageKv === NONE ? "Not set" : voltageKv}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Not set</SelectItem>
                {VOLTAGE_CLASSES_KV.map((kv) => (
                  <SelectItem key={kv} value={kv}>
                    {kv}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="grid-asset-sequence">Sequence</Label>
            <Input
              id="grid-asset-sequence"
              value={sequence}
              onChange={(event) => setSequence(event.target.value)}
              placeholder="10"
              inputMode="numeric"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="grid-asset-stationing">Stationing</Label>
            <Input
              id="grid-asset-stationing"
              value={stationing}
              onChange={(event) => setStationing(event.target.value)}
              placeholder="12+50"
            />
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="grid-asset-description">Description</Label>
            <Input
              id="grid-asset-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Dead-end structure, 3-pole H-frame"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createGridAsset.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createGridAsset.isPending}>
            {createGridAsset.isPending ? "Adding…" : "Add asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
