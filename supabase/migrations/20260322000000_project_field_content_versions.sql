-- Version history for AI writing assistant / PDF import field content
create table if not exists public.project_field_content_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  draft_key text,
  field_name text not null,
  content text not null,
  version_type text not null check (version_type in ('original', 'ai_generated', 'manual_edit', 'pdf_import')),
  ai_action text check (
    ai_action is null
    or ai_action in ('rephrase', 'summarize', 'improve', 'organize', 'pdf_import')
  ),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint project_field_content_versions_owner_check
    check (project_id is not null or draft_key is not null)
);

create index if not exists idx_project_field_versions_project_field
  on public.project_field_content_versions (project_id, field_name, created_at desc);

create index if not exists idx_project_field_versions_draft_field
  on public.project_field_content_versions (draft_key, field_name, created_at desc);

alter table public.project_field_content_versions enable row level security;

drop policy if exists "Admins can read project field versions" on public.project_field_content_versions;
create policy "Admins can read project field versions"
on public.project_field_content_versions
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert project field versions" on public.project_field_content_versions;
create policy "Admins can insert project field versions"
on public.project_field_content_versions
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can delete project field versions" on public.project_field_content_versions;
create policy "Admins can delete project field versions"
on public.project_field_content_versions
for delete
to authenticated
using (public.is_admin());
