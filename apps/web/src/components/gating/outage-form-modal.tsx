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
import { Textarea } from "@/components/ui/textarea";
import {
  OUTAGE_TYPE_LABELS,
  OUTAGE_TYPES,
  type OutageType,
} from "@/constants/gating";
import useCreateOutage from "@/hooks/mutations/outage/use-create-outage";
import useGetCircuits from "@/hooks/queries/circuit/use-get-circuits";

type OutageFormModalProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NONE = "none";

/** datetime-local gives "YYYY-MM-DDTHH:mm"; the API wants a full ISO string. */
function toIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function OutageFormModal({
  projectId,
  open,
  onOpenChange,
}: OutageFormModalProps) {
  const [title, setTitle] = useState("");
  const [outageNumber, setOutageNumber] = useState("");
  const [type, setType] = useState<OutageType>("clearance");
  const [circuitId, setCircuitId] = useState(NONE);
  const [requestedStart, setRequestedStart] = useState("");
  const [requestedEnd, setRequestedEnd] = useState("");
  const [notes, setNotes] = useState("");

  const { data: circuits } = useGetCircuits(projectId);
  const createOutage = useCreateOutage();

  const reset = () => {
    setTitle("");
    setOutageNumber("");
    setType("clearance");
    setCircuitId(NONE);
    setRequestedStart("");
    setRequestedEnd("");
    setNotes("");
  };

  const handleSubmit = async () => {
    const trimmed = title.trim();

    if (!trimmed) {
      toast.error("A title is required");
      return;
    }

    const start = toIso(requestedStart);
    const end = toIso(requestedEnd);

    // Catch the reversed window here so the user doesn't round-trip for it.
    if (start && end && new Date(end) < new Date(start)) {
      toast.error("The window can't end before it starts");
      return;
    }

    try {
      await createOutage.mutateAsync({
        projectId,
        title: trimmed,
        type,
        outageNumber: outageNumber.trim() || null,
        circuitId: circuitId === NONE ? null : circuitId,
        requestedStart: start,
        requestedEnd: end,
        notes: notes.trim() || null,
      });

      toast.success(`Requested ${trimmed}`);
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't request the outage",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request outage</DialogTitle>
          <DialogDescription>
            A clearance, planned outage, switching order, or hot line tag. It
            starts as a draft; record the approved window once the utility
            grants it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="outage-title">Title</Label>
            <Input
              id="outage-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Clearance for PS-140 to PS-145 wire pull"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(value) => {
                if (typeof value === "string" && value) {
                  setType(value as OutageType);
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue>{OUTAGE_TYPE_LABELS[type]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {OUTAGE_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {OUTAGE_TYPE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="outage-number">Outage / clearance number</Label>
            <Input
              id="outage-number"
              value={outageNumber}
              onChange={(event) => setOutageNumber(event.target.value)}
              placeholder="CLR-20261408"
            />
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
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
            <Label htmlFor="outage-start">Requested start</Label>
            <Input
              id="outage-start"
              type="datetime-local"
              value={requestedStart}
              onChange={(event) => setRequestedStart(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="outage-end">Requested end</Label>
            <Input
              id="outage-end"
              type="datetime-local"
              value={requestedEnd}
              onChange={(event) => setRequestedEnd(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="outage-notes">Notes</Label>
            <Textarea
              id="outage-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Switching limits, grounding requirements, contact for the system operator"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createOutage.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createOutage.isPending}>
            {createOutage.isPending ? "Requesting…" : "Request outage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
