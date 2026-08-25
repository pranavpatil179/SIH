"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface Slice {
  name: string;
  value: number;
  color: string;
}
export interface DeptLoad {
  dept: string;
  full: string;
  pending: number;
  cleared: number;
}
export interface NodalData {
  statusCounts: Slice[];
  categoryCounts: Slice[];
  deptLoad: DeptLoad[];
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4 h-64">{children}</div>
    </div>
  );
}

export function NodalCharts({ data }: { data: NodalData }) {
  // Recharts needs the DOM; render only after mount to avoid hydration issues.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <Panel
          title="Department workload"
          subtitle="Pending vs. cleared approvals — the tallest 'pending' bar is your bottleneck."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.deptLoad} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="dept" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ""}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="pending" name="Pending" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cleared" name="Cleared" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Approvals by status" subtitle="Where everything sits right now.">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.statusCounts}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.statusCounts.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Load by pollution category" subtitle="CPCB risk mix across all filings.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.categoryCounts} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Bar dataKey="value" name="Approvals" radius={[4, 4, 0, 0]}>
              {data.categoryCounts.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
