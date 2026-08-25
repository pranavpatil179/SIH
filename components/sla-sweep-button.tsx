"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Timer, Loader2 } from "lucide-react";
import { runSlaSweep } from "@/app/officer/actions";
import { Button } from "@/components/ui/button";

export function SlaSweepButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const n = await runSlaSweep();
            setMsg(n ? `${n} deemed-approved` : "none due yet");
            router.refresh();
          })
        }
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Timer className="h-4 w-4" />
        )}
        Run SLA sweep
      </Button>
    </div>
  );
}
