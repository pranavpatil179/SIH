import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Layers,
  GitBranch,
  BarChart3,
  FileCheck2,
  ArrowRight,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: FileCheck2,
    title: "Know Your Approvals",
    body: "Answer a short profile and get the exact list of approvals for your sector, location, size and stage — generated from rules, not guesswork.",
  },
  {
    icon: Layers,
    title: "Enter once, reuse everywhere",
    body: "Your business profile and documents are captured once and reused across every approval. No more re-uploading the same PAN a dozen times.",
  },
  {
    icon: GitBranch,
    title: "Parallel, coordinated workflow",
    body: "One click files to every relevant department at the same time — no sequential, siloed waiting.",
  },
  {
    icon: Clock,
    title: "Enforceable SLAs + deemed approval",
    body: "Every approval carries a statutory timer. Miss it, and the system auto-issues a deemed approval — accountability shifts to the government.",
  },
  {
    icon: ShieldCheck,
    title: "Risk-based scrutiny",
    body: "CPCB Red / Orange / Green / White drives how much scrutiny each unit needs — and bundles many inspections into one coordinated visit.",
  },
  {
    icon: BarChart3,
    title: "Governance analytics",
    body: "Live dashboards on approval times, pending vs. cleared, and the bottleneck department — so a state can actually improve its ease of doing business.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Udyami<span className="text-brand-600">Setu</span>
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-10 md:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
          Smart India Hackathon 2026
        </span>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
          One intelligent front door for{" "}
          <span className="text-brand-600">industrial approvals</span> and
          compliance.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">
          Opening a factory in India can mean 20+ approvals across 10
          departments and months of waiting. Udyami Setu tells you exactly what
          you need, files it in parallel, enforces every deadline, and gives
          government real-time visibility.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Start an application <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/departments"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Departments Demo (Officers)
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Other login
          </Link>
        </div>

        {/* Impact strip */}
        <div className="mt-12 grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:grid-cols-4">
          {[
            ["Months → Weeks", "approval time"],
            ["5 → 1", "site inspections"],
            ["Enter once", "reuse everywhere"],
            ["Rules-as-data", "scales to any state"],
          ].map(([big, small]) => (
            <div key={small}>
              <div className="text-xl font-bold text-brand-700">{big}</div>
              <div className="text-sm text-slate-500">{small}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          What makes it more than another form portal
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">
          Udyami Setu · A single-window prototype for streamlining industrial
          approvals · Designed to complement NSWS &amp; state single-window
          systems.
        </div>
      </footer>
    </main>
  );
}
