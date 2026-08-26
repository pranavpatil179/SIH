-- ============================================================================
-- Udyami Setu — Document Verification Migration
-- Run this AFTER schema.sql in the Supabase SQL Editor.
-- Adds: file_url + application_approval_id to documents,
--       document_extractions (OCR output),
--       document_verifications (QR + AI results)
-- ============================================================================

-- 1. Extend existing documents table
alter table documents
  add column if not exists file_url               text,
  add column if not exists application_approval_id uuid references application_approvals(id) on delete set null;

create index if not exists on documents (application_approval_id);

-- 2. OCR-extracted fields
create table if not exists document_extractions (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id) on delete cascade,
  licence_number  text,
  company_name    text,
  valid_from      date,
  valid_until     date,
  raw_text        text,
  created_at      timestamptz not null default now()
);

-- 3. Verification results (QR + AI + official)
create type if not exists qr_status_type     as enum ('match', 'mismatch', 'no_qr');
create type if not exists risk_level_type    as enum ('low', 'medium', 'high');
create type if not exists verify_status_type as enum ('verified', 'needs_review', 'flagged', 'pending');

create table if not exists document_verifications (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references documents(id) on delete cascade,
  qr_status       qr_status_type,
  qr_extracted    jsonb,
  ai_risk         risk_level_type,
  ai_reasoning    text,
  official_status text,              -- 'verified' | 'unverified' | 'na'
  overall_status  verify_status_type not null default 'pending',
  created_at      timestamptz not null default now()
);

create index if not exists on document_extractions   (document_id);
create index if not exists on document_verifications (document_id);

-- RLS
alter table document_extractions   enable row level security;
alter table document_verifications enable row level security;

-- Applicants can read extractions for their own business's documents
create policy "own_doc_extractions" on document_extractions for select
  using (document_id in (
    select d.id from documents d
    join businesses b on b.id = d.business_id
    where b.owner_id = auth.uid()
  ));

-- Officers and nodal can read extractions
create policy "staff_doc_extractions" on document_extractions for select
  using (auth_role() in ('officer', 'nodal'));

create policy "own_doc_verifications" on document_verifications for select
  using (document_id in (
    select d.id from documents d
    join businesses b on b.id = d.business_id
    where b.owner_id = auth.uid()
  ));

create policy "staff_doc_verifications" on document_verifications for select
  using (auth_role() in ('officer', 'nodal'));
