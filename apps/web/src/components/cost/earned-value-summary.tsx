import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";

type Totals = {
  budgetValue: number;
  earnedValue: number;
  remainingValue: number;
  budgetHours: number;
  earnedHours: number;
  actualHours: number;
  hoursVariance: number;
  productivityFactor: number | null;
  percentComplete: number;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const hours = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

function Tile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-background p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={cn(
          "mt-1 font-semibold text-lg tabular-nums",
          tone === "good" && "text-success-foreground",
          tone === "bad" && "text-destructive-foreground",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

/**
 * The four numbers a project manager checks first. Hours variance and productivity carry
 * a tone because they are the ones that mean good or bad news; revenue figures are just
 * facts.
 */
export default function EarnedValueSummary({ totals }: { totals: Totals }) {
  const { productivityFactor, hoursVariance } = totals;

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <Tile
        label="Contract value"
        value={money.format(totals.budgetValue)}
        hint={`${money.format(totals.remainingValue)} remaining`}
      />
      <Tile
        label="Earned to date"
        value={money.format(totals.earnedValue)}
        hint={`${totals.percentComplete}% of contract`}
      />
      <Tile
        label="Earned vs actual hours"
        value={`${hours.format(totals.earnedHours)} / ${hours.format(totals.actualHours)}`}
        hint={
          hoursVariance === 0
            ? "On the estimate"
            : `${hoursVariance > 0 ? "+" : ""}${hours.format(hoursVariance)} h ${
                hoursVariance > 0 ? "ahead" : "behind"
              }`
        }
        tone={
          totals.actualHours === 0
            ? undefined
            : hoursVariance >= 0
              ? "good"
              : "bad"
        }
      />
      <Tile
        label="Productivity factor"
        value={
          productivityFactor === null ? "—" : productivityFactor.toFixed(2)
        }
        hint={
          productivityFactor === null
            ? "No hours charged yet"
            : productivityFactor >= 1
              ? "Beating the estimate"
              : "Behind the estimate"
        }
        tone={
          productivityFactor === null
            ? undefined
            : productivityFactor >= 1
              ? "good"
              : "bad"
        }
      />

      <div className="col-span-2 rounded-lg border border-border/80 bg-background p-3 lg:col-span-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Contract complete</span>
          <span className="font-medium tabular-nums">
            {totals.percentComplete}%
          </span>
        </div>
        <Progress value={totals.percentComplete} className="mt-2 h-2" />
      </div>
    </div>
  );
}
