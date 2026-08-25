import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/lib/constants";
import type { ApprovalStatus } from "@/lib/types";

export function StatusChip({ status }: { status: ApprovalStatus }) {
  const meta = STATUS_META[status];
  return <Badge color={meta.color}>{meta.label}</Badge>;
}
