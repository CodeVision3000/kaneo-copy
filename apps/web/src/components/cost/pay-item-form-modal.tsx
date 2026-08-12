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
import useCreatePayItem from "@/hooks/mutations/pay-item/use-create-pay-item";
import useGetConstructionUnits from "@/hooks/queries/construction-unit/use-get-construction-units";
import useGetGridAssets from "@/hooks/queries/grid-asset/use-get-grid-assets";

type PayItemFormModalProps = {
  projectId: string;
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ACTIONS = ["install", "remove", "transfer", "relocate"] as const;
type Action = (typeof ACTIONS)[number];

const ACTION_LABELS: Record<Action, string> = {
  install: "Install",
  remove: "Remove",
  transfer: "Transfer",
  relocate: "Relocate",
};

const PROJECT_LEVEL = "project";

export default function PayItemFormModal({
  projectId,
  workspaceId,
  open,
  onOpenChange,
}: PayItemFormModalProps) {
  const [constructionUnitId, setConstructionUnitId] = useState("");
  const [action, setAction] = useState<Action>("install");
  const [quantity, setQuantity] = useState("");
  const [gridAssetId, setGridAssetId] = useState(PROJECT_LEVEL);

  const { data: units } = useGetConstructionUnits(workspaceId);
  const { data: assets } = useGetGridAssets(projectId);
  const createPayItem = useCreatePayItem();

  const selectedUnit = units?.find((u) => u.id === constructionUnitId);

  const handleSubmit = async () => {
    if (!constructionUnitId) {
      toast.error("Pick a construction unit");
      return;
    }

    if (!/^\d+(\.\d+)?$/.test(quantity.trim())) {
      toast.error("Quantity must be a non-negative number");
      return;
    }

    try {
      await createPayItem.mutateAsync({
        projectId,
        constructionUnitId,
        action,
        estimatedQuantity: quantity.trim(),
        gridAssetId: gridAssetId === PROJECT_LEVEL ? null : gridAssetId,
      });

      toast.success("Pay item added");
      setConstructionUnitId("");
      setQuantity("");
      setGridAssetId(PROJECT_LEVEL);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't add the pay item",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add pay item</DialogTitle>
          <DialogDescription>
            Price and standard hours come from the catalog entry for the chosen
            action, and are locked to this item so repricing the catalog later
            won't restate work already bid.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Construction unit</Label>
            <Select
              value={constructionUnitId}
              onValueChange={(value) => {
                if (typeof value === "string" && value) {
                  setConstructionUnitId(value);
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {selectedUnit
                    ? `${selectedUnit.code} — ${selectedUnit.description}`
                    : "Pick a unit"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {units?.length === 0 && (
                  <SelectItem value="" disabled>
                    No units in the catalog yet
                  </SelectItem>
                )}
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.code} — {unit.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Action</Label>
              <Select
                value={action}
                onValueChange={(value) => {
                  if (typeof value === "string" && value) {
                    setAction(value as Action);
                  }
                }}
              >
                <SelectTrigger size="sm">
                  <SelectValue>{ACTION_LABELS[action]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {ACTION_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="pay-item-quantity">
                Estimated quantity{" "}
                {selectedUnit ? `(${selectedUnit.unitOfMeasure})` : ""}
              </Label>
              <Input
                id="pay-item-quantity"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="24"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Scope</Label>
            <Select
              value={gridAssetId}
              onValueChange={(value) => {
                if (typeof value === "string" && value) {
                  setGridAssetId(value);
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue>
                  {gridAssetId === PROJECT_LEVEL
                    ? "Whole project"
                    : (assets?.find((a) => a.id === gridAssetId)?.designation ??
                      "Whole project")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROJECT_LEVEL}>Whole project</SelectItem>
                {assets?.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createPayItem.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createPayItem.isPending}>
            {createPayItem.isPending ? "Adding…" : "Add pay item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
