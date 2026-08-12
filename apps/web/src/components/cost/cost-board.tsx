import { HardHat, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useGetEarnedValue from "@/hooks/queries/pay-item/use-get-earned-value";
import EarnedValueSummary from "./earned-value-summary";
import PayItemFormModal from "./pay-item-form-modal";
import RecordProductionModal from "./record-production-modal";

type CostBoardProps = {
  projectId: string;
  workspaceId: string;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const ACTION_LABELS: Record<string, string> = {
  install: "Install",
  remove: "Remove",
  transfer: "Transfer",
  relocate: "Relocate",
};

/** Trailing zeros off a decimal string, so "6.50" reads as "6.5" and "4.00" as "4". */
function trimDecimal(value: string) {
  if (!value.includes(".")) return value;
  return value.replace(/\.?0+$/, "");
}

/**
 * The project's estimate in construction units, with what has been installed against each
 * line and what that has earned. This is the billing and earned-value surface.
 */
export default function CostBoard({ projectId, workspaceId }: CostBoardProps) {
  const [isPayItemOpen, setIsPayItemOpen] = useState(false);
  const [productionFor, setProductionFor] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const { data, isLoading, isError } = useGetEarnedValue(projectId);

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      {data && <EarnedValueSummary totals={data.totals} />}

      <div className="flex items-center gap-2">
        <h2 className="font-medium text-sm">Pay items</h2>
        <Button
          size="xs"
          className="ml-auto h-8 gap-1.5 text-xs"
          onClick={() => setIsPayItemOpen(true)}
        >
          <Plus className="size-3.5" />
          Add pay item
        </Button>
      </div>

      <div className="rounded-lg border border-border/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Est.</TableHead>
              <TableHead className="text-right">Installed</TableHead>
              <TableHead className="w-[150px]">Progress</TableHead>
              <TableHead className="text-right">Earned</TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  Loading pay items…
                </TableCell>
              </TableRow>
            )}

            {isError && (
              <TableRow>
                <TableCell colSpan={9} className="text-destructive-foreground">
                  Couldn't load the cost report.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <HardHat className="size-6 text-muted-foreground" />
                    <p className="font-medium text-sm">No pay items yet</p>
                    <p className="max-w-md text-muted-foreground text-xs">
                      Load the utility's rate sheet into the construction-unit
                      catalog in workspace settings, then add pay items here to
                      build the estimate.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((item) => (
              <TableRow key={item.payItemId}>
                <TableCell className="font-mono text-xs">{item.code}</TableCell>
                <TableCell className="text-xs">{item.description}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {ACTION_LABELS[item.action] ?? item.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {item.gridAssetDesignation ?? "Project"}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {trimDecimal(item.estimatedQuantity)} {item.unitOfMeasure}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {trimDecimal(item.installedQuantity)}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <Progress value={item.percentComplete} className="h-1.5" />
                    <span className="w-9 shrink-0 text-muted-foreground text-xs tabular-nums">
                      {item.percentComplete}%
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {money.format(Number(item.earnedValue))}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-7 text-xs"
                    onClick={() =>
                      setProductionFor({
                        id: item.payItemId,
                        label: `${item.code} · ${ACTION_LABELS[item.action] ?? item.action}`,
                      })
                    }
                  >
                    Post
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PayItemFormModal
        projectId={projectId}
        workspaceId={workspaceId}
        open={isPayItemOpen}
        onOpenChange={setIsPayItemOpen}
      />
      <RecordProductionModal
        projectId={projectId}
        payItem={productionFor}
        onClose={() => setProductionFor(null)}
      />
    </div>
  );
}
