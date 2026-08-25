# Udyami Setu — a single, intelligent front door for industrial approvals

> **SIH 2026 prototype.** One portal where an entrepreneur answers a few plain questions about their business and instantly gets: the *exact* list of licences/NOCs they need, which ones they can self-certify vs. which need inspection, a single coordinated inspection instead of many, live SLA countdowns with **automatic deemed approval** when a department misses its deadline, and the government support schemes they qualify for — while officers get a clean review console and the state gets a live analytics dashboard.

The intellectual core is a **regulatory knowledge engine** that treats regulations as **data, not code**: an approval catalogue plus applicability rules, evaluated by a small pure function. Adding a sector, a state, or a new licence means adding rows — not editing logic. No AI is involved in deciding legal requirements, so the output is deterministic and auditable.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [How it maps to your build plan (Stitch · Claude Code · Supabase)](#how-it-maps-to-your-build-plan)
3. [Prerequisites](#prerequisites)
4. [Setup — step by step](#setup--step-by-step)
5. [Demo logins](#demo-logins)
6. [The 4-minute demo script](#the-4-minute-demo-script)
7. [How the knowledge engine works](#how-the-knowledge-engine-works)
8. [Folding in Stitch designs](#folding-in-stitch-designs)
9. [Project structure](#project-structure)
10. [Deploying to Vercel](#deploying-to-vercel)
11. [⚠️ Security — read this](#-security--read-this)

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** + React 18 + TypeScript | One codebase for UI + server logic (server actions), great AI-tooling support |
| Styling | **Tailwind CSS** (shadcn-style primitives) | Fast, consistent, easy to paste designs into |
| Database + Auth | **Supabase** (Postgres + Row-Level Security) | Managed, generous free tier, SQL you can read |
| Charts | **Recharts** | Client-only analytics on the nodal dashboard |
| Hosting | **Vercel** (recommended) | Zero-config Next.js deploys |

Everything is a **managed, well-documented** service — deliberately chosen so the team can iterate quickly with AI assistance and avoid infra babysitting.

---

## How it maps to your build plan

You wanted **Stitch for the frontend, Claude Code for the backend, Supabase for the database.** Here's how each slots in:

- **Supabase (database)** — fully done. `supabase/schema.sql` is the entire data model + security policies; `supabase/seed.sql` loads the regulatory catalogue; `scripts/seed.mjs` creates demo users and a worked example. See [Setup](#setup--step-by-step).
- **Claude Code (backend)** — the "backend" here is Next.js **server actions** (`app/**/actions.ts`) and the **rules engine** (`lib/rules/`). The repo is structured so you can keep iterating on these with your local Claude Code CLI — pure functions, typed end to end, with a runnable test (`npm run test:engine`).
- **Stitch (frontend)** — the UI is built from small, self-contained components with the data-wiring cleanly separated from presentation, so Stitch-generated screens drop in with minimal rework. See [Folding in Stitch designs](#folding-in-stitch-designs).

---

## Prerequisites

- **Node.js 18.18+** (Node 20 or 22 recommended). Check with `node --version`.
- A free **Supabase** account → <https://supabase.com>.
- That's it. No Docker, no local Postgres.

---

## Setup — step by step

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**. Pick a region close to you and set a database password.
2. Once it's ready, open **Project Settings → API** and copy three things:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon / public** key
   - **service_role** key (this one is secret — server-side only)

### 3. Create your `.env.local`

Copy the example and fill in the three values from step 2:

```bash
cp .env.local.example .env.local
```

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Demo speed dial: real seconds per "SLA day".
#   1     -> a 30-day SLA visibly breaches in 30 seconds on stage (great for demos)
#   86400 -> real calendar time
NEXT_PUBLIC_SLA_SECONDS_PER_DAY=1
```

> `.env.local` is git-ignored. **Never** commit it or paste these keys anywhere.

### 4. Create the database schema + load the rules

In the Supabase dashboard, open **SQL Editor** and run these two files **in order**:

1. Paste the contents of **`supabase/schema.sql`** → **Run**. (Creates all tables, enums, Row-Level Security policies, and the trigger that provisions a profile on signup.)
2. Paste the contents of **`supabase/seed.sql`** → **Run**. (Loads the departments, approval catalogue, applicability rules, and schemes — the "brain" of the engine.)

### 5. Turn off email confirmation (for a smooth demo)

Auth → **Sign In / Providers → Email** → toggle **Confirm email** *off*. This lets demo signups log in immediately. (In production you'd leave it on; the app already handles the email-confirmation redirect via `/auth/callback`.)

### 6. Seed demo users + a worked-through application

```bash
npm run seed
```

This creates the five demo logins below and one fully populated application ("Sunrise Foods") so the officer queue and nodal analytics look alive on first run. It's **idempotent** — safe to re-run.

### 7. Run it

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Demo logins

Password for **all** demo users: `Passw0rd!`

| Email | Role | What you'll see |
|---|---|---|
| `applicant@demo.in` | Applicant | **Empty** — use this for a fresh, live "answer questions → get checklist → file" walkthrough |
| `sunrise@demo.in` | Applicant | Pre-filled Sunrise Foods application with a realistic spread of statuses |
| `officer.spcb@demo.in` | Officer (Pollution Board) | Review console for the SPCB queue |
| `officer.factories@demo.in` | Officer (Factories) | Review console for the Factories queue |
| `nodal@demo.in` | Nodal | State-wide analytics dashboard |

The login screen has one-click quick-fill buttons for the common demo accounts.

---

## The 4-minute demo script

This is the recommended flow to show the judges — it hits every "wow" moment.

1. **Know-Your-Approvals (≈60s).** Log in as `applicant@demo.in` → **New application**. Answer a few questions (sector, size, pollution category, stage, state). Hit **Generate** → the engine instantly returns the *exact* checklist, each item tagged **self-certify / inspection / full inspection** with a plain-language reason and the statutory SLA. Point out the **coordinated-inspection callout** — several licences bundled into one site visit.

2. **One-click filing + instant self-certification (≈30s).** Hit **File all now**. Self-certifiable items are **auto-approved on the spot**; the rest are routed to the right department queues with an SLA clock started.

3. **Officer console (≈45s).** In another tab, log in as `officer.spcb@demo.in`. See the item land in the queue with a live countdown. **Approve** one, **raise a query** on another (watch the SLA clock pause because the ball is now in the applicant's court), **schedule an inspection** on a third.

4. **Deemed approval fires on stage (≈45s).** Because `NEXT_PUBLIC_SLA_SECONDS_PER_DAY=1`, a 30-day SLA lapses in 30 seconds. When a clock hits zero, hit **Run SLA sweep** (or just reload) → the overdue item flips to **Deemed Approved** automatically. This is the single-window promise made visible: government delay no longer blocks the entrepreneur.

5. **Nodal analytics (≈40s).** Log in as `nodal@demo.in`. Show the live KPIs (applications, average clearance time, deemed approvals), the **department-workload chart** (the tallest "pending" bar is the bottleneck), status mix, and the pollution-category load — the state's real-time view of where friction is.

---

## How the knowledge engine works

Regulations live as **data** in two catalogue tables (mirrored for offline/dev use in `lib/rules/data.ts`):

- **`approval_types`** — the catalogue of licences/NOCs: authority, department, legal basis, statutory SLA days, required documents, whether it needs inspection.
- **`applicability_rules`** — for each approval, an `applies_if` condition (sector / pollution category / stage / size) and a per-category `scrutiny_level` map (e.g. Red → `full_inspection`, Orange → `inspection`, Green → `self_certify`, White → `not_required`).

The pure function `computeChecklist(profile, approvals, rules)` in `lib/rules/engine.ts` evaluates the rules against a business profile and returns an ordered checklist. `matchSchemes()` does the same for incentive schemes.

**To add a new licence or a new sector, you add rows** to `supabase/seed.sql` (and, for local fixtures, `lib/rules/data.ts`) — **you do not touch the engine code.** That's the whole design: legally-sensitive logic stays declarative and auditable.

Run the engine's test suite anytime:

```bash
npm run test:engine
```

It checks golden paths (food/Orange, chemical/Red, IT/White) — currently **15/15 passing**.

---

## Folding in Stitch designs

The UI is intentionally split so design and data don't fight:

- **Presentation** lives in `components/ui/*` (button, card, badge, input, …) and the screen components.
- **Data + logic** lives in server components (`app/**/page.tsx`) and server actions (`app/**/actions.ts`).

To bring a Stitch screen in:

1. Generate the screen in Stitch and export the HTML/Tailwind.
2. Drop the markup into the matching page/component (e.g. the applicant dashboard is `app/app/page.tsx`, the KYA wizard is `app/app/new/page.tsx`).
3. Keep the existing data props and server-action calls — replace only the visual markup and classes. Because we already use Tailwind, Stitch's utility classes paste in directly.
4. Reuse the shared primitives in `components/ui/*` where you can, so the look stays consistent.

Tip: start with the **landing page** (`app/page.tsx`) and the **login** screen — they're the most self-contained and the easiest place to establish the visual language before styling the app shell (`components/app-bar.tsx`).

---

## Project structure

```
app/
  page.tsx              Landing page
  login/ signup/        Auth screens (client)
  post-login/           Role-based router after login
  auth/callback/        Email-confirmation handler
  app/                  Applicant: dashboard, new-application wizard, actions
  officer/              Officer console + review actions
  nodal/                State analytics dashboard
components/
  ui/                   Reusable primitives (button, card, badge, input, …)
  *.tsx                 Feature components (status chips, SLA countdown, charts, …)
lib/
  rules/                The knowledge engine + rules-as-data + tests
  supabase/             Browser / server / admin clients + auth middleware
  auth.ts               Session + profile + role-guard helpers
  constants.ts          Labels, colours, form options, SLA speed-dial
  types.ts              Domain types (mirror the DB schema)
supabase/
  schema.sql            Full schema + Row-Level Security (run first)
  seed.sql              Regulatory catalogue (run second)
scripts/
  seed.mjs              Demo users + worked example (npm run seed)
```

---

## Deploying to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel → **New Project** → import the repo.
3. Add the same env vars from your `.env.local` under **Settings → Environment Variables** (set `NEXT_PUBLIC_SLA_SECONDS_PER_DAY=86400` for a realistic production clock, or keep it low for a hosted demo).
4. Deploy. Point Supabase **Auth → URL Configuration → Site URL / Redirect URLs** at your Vercel domain so email links resolve.

---

## ⚠️ Security — read this

- **Rotate the Supabase Personal Access Token you shared in chat.** The token beginning `sbp_…` is an **account-level** token that can administer *all* your Supabase projects. Anything pasted into a chat should be treated as compromised. Go to **Supabase Dashboard → Account → Access Tokens**, revoke it, and generate a new one if you need it. This app does **not** use that token anywhere — it uses your project URL + anon key + service-role key via `.env.local`.
- **Also rotate the Google API key** (beginning `AQ.…`) that was shared while testing Stitch, for the same reason.
- **Never commit `.env.local`** (it's git-ignored) and never paste keys into chat, issues, or screenshots. Use the placeholders in `.env.local.example`.
- The **service-role key** bypasses Row-Level Security and must stay server-side only. It is used exclusively in server actions and the seed script — never in a client component.
