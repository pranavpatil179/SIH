"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function format(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/**
 * Live SLA countdown. Because sla_due_at is stored as a real timestamp (the
 * demo speed-dial is baked in at submission time), this just ticks down to it.
 */
export function SLACountdown({
  dueAt,
  decided = false,
  className,
}: {
  dueAt: string | null;
  decided?: boolean;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (decided || !dueAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [decided, dueAt]);

  if (!dueAt)
    return <span className={cn("text-xs text-slate-400", className)}>—</span>;
  if (decided)
    return (
      <span className={cn("text-xs text-slate-400", className)}>closed</span>
    );

  const remaining = new Date(dueAt).getTime() - now;
  const overdue = remaining <= 0;
  const urgent = !overdue && remaining < 24 * 3600 * 1000;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        overdue
          ? "text-red-600"
          : urgent
            ? "text-amber-600"
            : "text-slate-600",
        className,
      )}
    >
      {overdue ? (
        <>
          <AlertTriangle className="h-3.5 w-3.5" /> SLA breached
        </>
      ) : (
        <>
          <Clock className="h-3.5 w-3.5" /> {format(remaining)} left
        </>
      )}
    </span>
  );
}
