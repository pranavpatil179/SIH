"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  MessageSquareWarning,
  CalendarClock,
  X,
  Loader2,
} from "lucide-react";
import {
  approveApproval,
  rejectApproval,
  raiseQuery,
  scheduleInspection,
} from "@/app/officer/actions";
import { Button } from "@/components/ui/button";

const DECIDED = ["approved", "deemed_approved", "rejected"];

export function OfficerActions({
  id,
  status,
  requiresInspection,
}: {
  id: string;
  status: string;
  requiresInspection: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<null | "query">(null);
  const [note, setNote] = useState("");

  if (DECIDED.includes(status)) {
    return <span className="text-xs text-slate-400">No action needed</span>;
  }

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      setMode(null);
      setNote("");
      router.refresh();
    });

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <Button size="sm" onClick={() => run(() => approveApproval(id))} disabled={pending}>
          <Check className="h-4 w-4" /> Approve
        </Button>
        {requiresInspection && status !== "inspection_scheduled" && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => run(() => scheduleInspection(id))}
            disabled={pending}
          >
            <CalendarClock className="h-4 w-4" /> Inspect
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setMode(mode === "query" ? null : "query")}
          disabled={pending}
        >
          <MessageSquareWarning className="h-4 w-4" /> Query
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => run(() => rejectApproval(id))}
          disabled={pending}
        >
          <X className="h-4 w-4" /> Reject
        </Button>
      </div>

      {mode === "query" && (
        <div className="flex w-full max-w-md flex-col gap-2 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="What does the applicant need to fix?"
            className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => note.trim() && run(() => raiseQuery(id, note.trim()))}
              disabled={pending || !note.trim()}
            >
              Send query
            </Button>
          </div>
        </div>
      )}

      {pending && (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </span>
      )}
    </div>
  );
}
