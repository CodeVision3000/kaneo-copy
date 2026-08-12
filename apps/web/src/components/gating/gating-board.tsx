import { format } from "date-fns";
import { ClipboardCheck, FileCheck2, Plus, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_TONES,
  INSPECTION_TYPE_LABELS,
  type InspectionStatus,
  type InspectionType,
  OUTAGE_STATUS_LABELS,
  OUTAGE_STATUS_TONES,
  OUTAGE_TYPE_LABELS,
  type OutageStatus,
  type OutageType,
  PERMIT_STATUS_LABELS,
  PERMIT_STATUS_TONES,
  PERMIT_TYPE_LABELS,
  type PermitStatus,
  type PermitType,
} from "@/constants/gating";
import useGetInspections from "@/hooks/queries/inspection/use-get-inspections";
import useGetOutages from "@/hooks/queries/outage/use-get-outages";
import useGetPermits from "@/hooks/queries/permit/use-get-permits";
import { cn } from "@/lib/cn";
import OutageFormModal from "./outage-form-modal";

type GatingBoardProps = {
  projectId: string;
};

type Tab = "outages" | "permits" | "inspections";

const TABS: Array<{ id: Tab; label: string; icon: typeof Zap }> = [
  { id: "outages", label: "Outages", icon: Zap },
  { id: "permits", label: "Permits", icon: FileCheck2 },
  { id: "inspections", label: "Inspections", icon: ClipboardCheck },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy HH:mm");
}

function formatDay(value: string | null | undefined) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy");
}

/**
 * Everything that stops work from starting, in one place: clearances and outage
 * windows, permits, and inspections. Three tabs rather than three sidebar entries --
 * a project manager checks all three together when deciding what a crew can do
 * tomorrow.
 */
export default function GatingBoard({ projectId }: GatingBoardProps) {
  const [tab, setTab] = useState<Tab>("outages");
  const [isOutageFormOpen, setIsOutageFormOpen] = useState(false);

  const outages = useGetOutages(projectId);
  const permits = useGetPermits(projectId);
  const inspections = useGetInspections(projectId);

  const counts = {
    outages: outages.data?.length ?? 0,
    permits: permits.data?.length ?? 0,
    inspections: inspections.data?.length ?? 0,
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-border/80 bg-background p-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={tab === id ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setTab(id)}
              className={cn(
                "h-6 gap-1.5 rounded-md px-2 text-xs",
                tab !== id && "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
              <span className="text-muted-foreground">{counts[id]}</span>
            </Button>
          ))}
        </div>

        {tab === "outages" && (
          <Button
            size="xs"
            className="ml-auto h-8 gap-1.5 text-xs"
            onClick={() => setIsOutageFormOpen(true)}
          >
            <Plus className="size-3.5" />
            Request outage
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border/80">
        {tab === "outages" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outage</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Circuit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Window</TableHead>
                <TableHead className="w-[80px]">Gates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outages.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    Loading outages…
                  </TableCell>
                </TableRow>
              )}

              {!outages.isLoading && counts.outages === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <Zap className="size-6 text-muted-foreground" />
                      <p className="font-medium text-sm">
                        No outages requested
                      </p>
                      <p className="max-w-sm text-muted-foreground text-xs">
                        Request a clearance or outage window, then attach the
                        tasks it gates.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {outages.data?.map((outage) => {
                const status = outage.status as OutageStatus;
                // Show the granted window once it exists; until then the request.
                const start = outage.approvedStart ?? outage.requestedStart;
                const end = outage.approvedEnd ?? outage.requestedEnd;

                return (
                  <TableRow key={outage.id}>
                    <TableCell className="font-medium">
                      {outage.title}
                      {outage.outageNumber && (
                        <span className="mt-0.5 block font-mono text-muted-foreground text-xs">
                          {outage.outageNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {OUTAGE_TYPE_LABELS[outage.type as OutageType] ??
                        outage.type}
                    </TableCell>
                    <TableCell className="text-xs">
                      {outage.circuitDesignation ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={OUTAGE_STATUS_TONES[status] ?? "secondary"}
                        className="text-xs"
                      >
                        {OUTAGE_STATUS_LABELS[status] ?? outage.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {start ? (
                        <>
                          {formatDate(start)}
                          <span className="block text-muted-foreground">
                            to {formatDate(end)}
                            {!outage.approvedStart && " (requested)"}
                          </span>
                        </>
                      ) : (
                        "Not scheduled"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {outage.gatedTaskCount ?? 0}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {tab === "permits" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Authority</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permits.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    Loading permits…
                  </TableCell>
                </TableRow>
              )}

              {!permits.isLoading && counts.permits === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <FileCheck2 className="size-6 text-muted-foreground" />
                      <p className="font-medium text-sm">No permits tracked</p>
                      <p className="max-w-sm text-muted-foreground text-xs">
                        Track ROW access, road openings, railroad crossings, and
                        environmental permits so lapses surface before a crew
                        mobilizes.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {permits.data?.map((permit) => {
                const status = permit.status as PermitStatus;
                return (
                  <TableRow key={permit.id}>
                    <TableCell className="font-medium">
                      {PERMIT_TYPE_LABELS[permit.type as PermitType] ??
                        permit.type}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {permit.permitNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {permit.issuingAuthority ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {permit.gridAssetDesignation ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={PERMIT_STATUS_TONES[status] ?? "secondary"}
                        className="text-xs"
                      >
                        {PERMIT_STATUS_LABELS[status] ?? permit.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDay(permit.expiresAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {tab === "inspections" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Hold point</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Inspector</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Loading inspections…
                  </TableCell>
                </TableRow>
              )}

              {!inspections.isLoading && counts.inspections === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <ClipboardCheck className="size-6 text-muted-foreground" />
                      <p className="font-medium text-sm">
                        No inspections scheduled
                      </p>
                      <p className="max-w-sm text-muted-foreground text-xs">
                        Mark an inspection as a hold point and its task can't be
                        completed until the inspection passes or is waived.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {inspections.data?.map((inspection) => {
                const status = inspection.status as InspectionStatus;
                return (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">
                      {INSPECTION_TYPE_LABELS[
                        inspection.type as InspectionType
                      ] ?? inspection.type}
                    </TableCell>
                    <TableCell className="text-xs">
                      {inspection.taskTitle ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {inspection.gridAssetDesignation ?? "—"}
                    </TableCell>
                    <TableCell>
                      {inspection.isHoldPoint ? (
                        <Badge variant="warning" className="text-xs">
                          Hold point
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={INSPECTION_STATUS_TONES[status] ?? "secondary"}
                        className="text-xs"
                      >
                        {INSPECTION_STATUS_LABELS[status] ?? inspection.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDay(inspection.scheduledFor)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {inspection.inspectorName ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <OutageFormModal
        projectId={projectId}
        open={isOutageFormOpen}
        onOpenChange={setIsOutageFormOpen}
      />
    </div>
  );
}
