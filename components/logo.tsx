import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Building2 className="h-5 w-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        Udyami<span className="text-brand-600">Setu</span>
      </span>
    </div>
  );
}
