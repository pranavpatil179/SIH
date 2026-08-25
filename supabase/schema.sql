-- ============================================================================
-- Udyami Setu — database schema (Supabase / Postgres)
-- Run this FIRST in the Supabase SQL Editor, then run seed.sql.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type user_role as enum ('applicant', 'officer', 'nodal', 'inspector');
create type sector as enum ('food_processing', 'chemical', 'textile', 'engineering', 'it_services');
create type pollution_category as enum ('red', 'orange', 'green', 'white');
create type project_stage as enum ('new_setup', 'operating', 'expansion');
create type project_size as enum ('micro', 'small', 'medium', 'large');
create type scrutiny_level as enum ('full_inspection', 'inspection', 'self_certify', 'not_required');
create type approval_status as enum (
  'not_started', 'submitted', 'under_scrutiny', 'query_raised',
  'inspection_scheduled', 'approved', 'rejected', 'deemed_approved'
);
create type application_status as enum ('draft', 'submitted', 'in_progress', 'completed');
create type validation_status as enum ('pending', 'valid', 'invalid', 'expired');

-- ---------- Reference / catalog tables ----------
create table departments (
  id                text primary key,
  name              text not null,
  sla_default_days  int  not null default 30
);

create table approval_types (
  id                 text primary key,
  name               text not null,
  authority          text not null,
  department_id      text not null references departments(id),
  legal_basis        text not null,
  sla_days           int  not null,
  required_documents text[] not null default '{}',
  requires_inspection boolean not null default false,
  fee_note           text
);

create table applicability_rules (
  approval_id     text primary key references approval_types(id),
  applies_if      jsonb not null default '{}',
  scrutiny_level  jsonb not null default '{}'
);

create table schemes (
  id           text primary key,
  name         text not null,
  authority    text not null,
  benefit      text not null,
  eligibility  jsonb not null default '{}'
);

-- ---------- User + business data ----------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null default 'applicant',
  full_name     text,
  department_id text references departments(id)
);

create table businesses (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  pan        text,
  sector     sector not null,
  address    text,
  state      text,
  created_at timestamptz not null default now()
);

create table projects (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references businesses(id) on delete cascade,
  name               text not null,
  location_state     text not null,
  project_size       project_size not null,
  pollution_category pollution_category not null,
  stage              project_stage not null,
  created_at         timestamptz not null default now()
);

create table applications (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  status     application_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table application_approvals (
  id                  uuid primary key default gen_random_uuid(),
  application_id      uuid not null references applications(id) on delete cascade,
  approval_type_id    text not null references approval_types(id),
  department_id       text not null references departments(id),
  status              approval_status not null default 'submitted',
  scrutiny_level      scrutiny_level not null default 'self_certify',
  requires_inspection boolean not null default false,
  sla_due_at          timestamptz,
  submitted_at        timestamptz default now(),
  decided_at          timestamptz,
  decided_by          uuid references auth.users(id),
  query_note          text
);

create table documents (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  doc_type          text not null,
  file_name         text not null,
  validation_status validation_status not null default 'pending',
  expiry_date       date,
  created_at        timestamptz not null default now()
);

create table inspections (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references applications(id) on delete cascade,
  scheduled_at      timestamptz not null,
  inspector_name    text,
  approvals_covered text[] not null default '{}'
);

create table grievances (
  id                     uuid primary key default gen_random_uuid(),
  application_approval_id uuid not null references application_approvals(id) on delete cascade,
  level                  int  not null default 1,
  status                 text not null default 'open',
  note                   text,
  created_at             timestamptz not null default now()
);

create table audit_log (
  id         bigint generated always as identity primary key,
  actor      uuid,
  action     text not null,
  detail     jsonb,
  created_at timestamptz not null default now()
);

create index on application_approvals (application_id);
create index on application_approvals (department_id, status);
create index on projects (business_id);

-- ---------- Helper functions (SECURITY DEFINER avoids RLS recursion) ----------
create or replace function auth_role() returns user_role
  language sql stable security definer set search_path = public as $$
    select role from profiles where id = auth.uid();
  $$;

create or replace function auth_department() returns text
  language sql stable security definer set search_path = public as $$
    select department_id from profiles where id = auth.uid();
  $$;

-- Auto-create a profile row when a new auth user is created.
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
  begin
    insert into public.profiles (id, role, full_name, department_id)
    values (
      new.id,
      coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'applicant'),
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'department_id'
    )
    on conflict (id) do nothing;
    return new;
  end;
  $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Row-Level Security ----------
alter table profiles             enable row level security;
alter table businesses           enable row level security;
alter table projects             enable row level security;
alter table applications         enable row level security;
alter table application_approvals enable row level security;
alter table documents            enable row level security;
alter table inspections          enable row level security;
alter table grievances           enable row level security;
alter table departments          enable row level security;
alter table approval_types       enable row level security;
alter table applicability_rules  enable row level security;
alter table schemes              enable row level security;
alter table audit_log            enable row level security;

-- Catalog: any authenticated user may read.
create policy "catalog_read" on departments        for select to authenticated using (true);
create policy "catalog_read" on approval_types      for select to authenticated using (true);
create policy "catalog_read" on applicability_rules for select to authenticated using (true);
create policy "catalog_read" on schemes             for select to authenticated using (true);

-- Profiles: read/update your own.
create policy "own_profile_read"   on profiles for select using (id = auth.uid());
create policy "own_profile_update" on profiles for update using (id = auth.uid());

-- Businesses.
create policy "own_businesses" on businesses for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Projects (via business ownership).
create policy "own_projects" on projects for all
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

-- Applications (via project -> business ownership).
create policy "own_applications" on applications for all
  using (project_id in (
    select p.id from projects p
    join businesses b on b.id = p.business_id
    where b.owner_id = auth.uid()))
  with check (project_id in (
    select p.id from projects p
    join businesses b on b.id = p.business_id
    where b.owner_id = auth.uid()));

-- Application approvals: applicant owns; officer sees own department; nodal sees all.
create policy "approvals_applicant" on application_approvals for all
  using (application_id in (
    select a.id from applications a
    join projects p on p.id = a.project_id
    join businesses b on b.id = p.business_id
    where b.owner_id = auth.uid()))
  with check (application_id in (
    select a.id from applications a
    join projects p on p.id = a.project_id
    join businesses b on b.id = p.business_id
    where b.owner_id = auth.uid()));
create policy "approvals_officer_read" on application_approvals for select
  using (auth_role() = 'officer' and department_id = auth_department());
create policy "approvals_nodal_read" on application_approvals for select
  using (auth_role() = 'nodal');

-- Documents (via business ownership).
create policy "own_documents" on documents for all
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

-- Inspections.
create policy "inspections_applicant" on inspections for select
  using (application_id in (
    select a.id from applications a
    join projects p on p.id = a.project_id
    join businesses b on b.id = p.business_id
    where b.owner_id = auth.uid()));
create policy "inspections_staff" on inspections for select
  using (auth_role() in ('officer', 'nodal', 'inspector'));

-- Grievances (via the applicant's approval).
create policy "own_grievances" on grievances for all
  using (application_approval_id in (
    select aa.id from application_approvals aa
    join applications a on a.id = aa.application_id
    join projects p on p.id = a.project_id
    join businesses b on b.id = p.business_id
    where b.owner_id = auth.uid()))
  with check (application_approval_id in (
    select aa.id from application_approvals aa
    join applications a on a.id = aa.application_id
    join projects p on p.id = a.project_id
    join businesses b on b.id = p.business_id
    where b.owner_id = auth.uid()));

-- Audit log: nodal read.
create policy "audit_nodal_read" on audit_log for select using (auth_role() = 'nodal');
