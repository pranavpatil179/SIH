import type {
  ApprovalStatus,
  PollutionCategory,
  ScrutinyLevel,
} from "@/lib/types";

// --- Demo speed dial ------------------------------------------------------
// How many real seconds represent one "SLA day". 86400 = real time.
// Set to 1 in .env.local for a live demo where a 30-day SLA breaches in 30s.
export const SLA_SECONDS_PER_DAY = Number(
  process.env.NEXT_PUBLIC_SLA_SECONDS_PER_DAY ?? "86400",
);

/** Compute an SLA deadline from a start timestamp + a number of SLA days. */
export function slaDueFrom(startISO: string, slaDays: number): string {
  const start = new Date(startISO).getTime();
  return new Date(start + slaDays * SLA_SECONDS_PER_DAY * 1000).toISOString();
}

// --- Presentation metadata ------------------------------------------------

export const STATUS_META: Record<
  ApprovalStatus,
  { label: string; color: string }
> = {
  not_started: {
    label: "Not started",
    color: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  submitted: {
    label: "Submitted",
    color: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  under_scrutiny: {
    label: "Under scrutiny",
    color: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  query_raised: {
    label: "Query raised",
    color: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  inspection_scheduled: {
    label: "Inspection scheduled",
    color: "bg-purple-50 text-purple-700 ring-purple-200",
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 ring-red-200",
  },
  deemed_approved: {
    label: "Deemed approved",
    color: "bg-teal-50 text-teal-700 ring-teal-200",
  },
};

export const CATEGORY_META: Record<
  PollutionCategory,
  { label: string; color: string; dot: string }
> = {
  red: {
    label: "Red",
    color: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  orange: {
    label: "Orange",
    color: "bg-orange-50 text-orange-700 ring-orange-200",
    dot: "bg-orange-500",
  },
  green: {
    label: "Green",
    color: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  white: {
    label: "White",
    color: "bg-slate-50 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
  },
};

export const SCRUTINY_META: Record<ScrutinyLevel, string> = {
  full_inspection: "Full inspection",
  inspection: "Inspection required",
  self_certify: "Self-certification",
  not_required: "No consent required",
};

// --- Form option lists ----------------------------------------------------

export const SECTORS = [
  { value: "food_processing", label: "Food processing / packaged food" },
  { value: "chemical", label: "Chemical manufacturing" },
  { value: "textile", label: "Textile / apparel" },
] as const;

export const STAGES = [
  { value: "new_setup", label: "New setup" },
  { value: "operating", label: "Operating" },
  { value: "expansion", label: "Expansion" },
] as const;

export const SIZES = [
  { value: "micro", label: "Micro" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
] as const;

export const CATEGORIES = [
  { value: "red", label: "Red (highly polluting)" },
  { value: "orange", label: "Orange" },
  { value: "green", label: "Green" },
  { value: "white", label: "White (non-polluting)" },
] as const;

export const STATES = [
  "Telangana",
  "Maharashtra",
  "Karnataka",
  "Gujarat",
  "Tamil Nadu",
  "Uttar Pradesh",
] as const;
