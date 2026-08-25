import { Badge } from "@/components/ui/badge";
import { CATEGORY_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PollutionCategory } from "@/lib/types";

export function CategoryBadge({ category }: { category: PollutionCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <Badge color={meta.color}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}
