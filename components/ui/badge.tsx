import { cn } from "@/lib/utils";

/** Small pill. Pass `color` as Tailwind classes (bg/text/ring) for the variant. */
export function Badge({
  className,
  color,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        color ?? "bg-slate-100 text-slate-700 ring-slate-200",
        className,
      )}
      {...props}
    />
  );
}
