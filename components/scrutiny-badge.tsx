import { Badge } from "@/components/ui/badge";
import { SCRUTINY_META } from "@/lib/constants";
import type { ScrutinyLevel } from "@/lib/types";

const COLORS: Record<ScrutinyLevel, string> = {
  full_inspection: "bg-red-50 text-red-700 ring-red-200",
  inspection: "bg-amber-50 text-amber-700 ring-amber-200",
  self_certify: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  not_required: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function ScrutinyBadge({ level }: { level: ScrutinyLevel }) {
  return <Badge color={COLORS[level]}>{SCRUTINY_META[level]}</Badge>;
}
