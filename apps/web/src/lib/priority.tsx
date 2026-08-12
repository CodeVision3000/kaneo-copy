import {
  ChevronDown,
  ChevronsUp,
  ChevronUp,
  CircleAlert,
  Minus,
} from "lucide-react";

export function getPriorityIcon(priority: string) {
  switch (priority) {
    case "emergency":
      return (
        <CircleAlert className="h-[12px] w-[12px] text-destructive-foreground" />
      );
    case "urgent":
      return (
        <ChevronsUp className="h-[12px] w-[12px] text-warning-foreground" />
      );
    case "expedited":
      return (
        <ChevronUp className="h-[12px] w-[12px] text-warning-foreground/80" />
      );
    case "routine":
      return (
        <ChevronDown className="h-[12px] w-[12px] text-info-foreground/85" />
      );
    case "no-priority":
      return <Minus className="h-[12px] w-[12px] text-muted-foreground" />;
    default:
      return <Minus className="h-[12px] w-[12px] text-muted-foreground" />;
  }
}
