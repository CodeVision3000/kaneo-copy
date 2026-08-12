import { format } from "date-fns";
import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import useRecordProduction from "@/hooks/mutations/pay-item/use-record-production";

type RecordProductionModalProps = {
  projectId: string;
  payItem: { id: string; label: string } | null;
  onClose: () => void;
};

export default function RecordProductionModal({
  projectId,
  payItem,
  onClose,
}: RecordProductionModalProps) {
  const [quantity, setQuantity] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [notes, setNotes] = useState("");

  const recordProduction = useRecordProduction();

  // Default to today each time the dialog opens on a new line item.
  useEffect(() => {
    if (payItem) {
      setEntryDate(format(new Date(), "yyyy-MM-dd"));
      setQuantity("");
      setNotes("");
    }
  }, [payItem]);

  const handleSubmit = async () => {
    if (!payItem) return;

    if (!/^\d+(\.\d+)?$/.test(quantity.trim())) {
      toast.error("Quantity must be a non-negative number");
      return;
    }

    const date = new Date(entryDate);
    if (Number.isNaN(date.getTime())) {
      toast.error("Pick a valid date");
      return;
    }

    try {
      await recordProduction.mutateAsync({
        projectId,
        payItemId: payItem.id,
        quantity: quantity.trim(),
        entryDate: date.toISOString(),
        notes: notes.trim() || null,
      });

      toast.success("Production posted");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't post production",
      );
    }
  };

  return (
    <Dialog open={Boolean(payItem)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Post production</DialogTitle>
          <DialogDescription>{payItem?.label}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="production-quantity">Quantity installed</Label>
            <Input
              id="production-quantity"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="4"
              inputMode="decimal"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="production-date">Date</Label>
            <Input
              id="production-date"
              type="date"
              value={entryDate}
              onChange={(event) => setEntryDate(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="production-notes">Notes</Label>
            <Textarea
              id="production-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Structures PS-140 through PS-143"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={recordProduction.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={recordProduction.isPending}>
            {recordProduction.isPending ? "Posting…" : "Post production"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
