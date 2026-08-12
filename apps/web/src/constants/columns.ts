import {
  Calendar,
  Check,
  Circle,
  CircleDot,
  Search,
  Shield,
  Zap,
} from "lucide-react";

// Mirrors DEFAULT_PROJECT_COLUMNS in the API
// (apps/api/src/project/controllers/create-project.ts). Used by lib/i18n/domain.ts to
// decide whether a column name is a default worth translating.
export const DEFAULT_COLUMNS = [
  { id: "scheduled", name: "Scheduled", icon: Calendar },
  { id: "ready", name: "Ready to Build", icon: Circle },
  { id: "in-progress", name: "In Progress", icon: CircleDot },
  { id: "awaiting-clearance", name: "Awaiting Clearance", icon: Shield },
  { id: "awaiting-inspection", name: "Awaiting Inspection", icon: Search },
  { id: "complete", name: "Complete", icon: Check },
  { id: "energized", name: "Energized", icon: Zap },
] as const;
