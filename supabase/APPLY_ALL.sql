-- Combined Phase 3 migration for Supabase SQL Editor
-- Portfolio - Villafuerte Charlotte
-- Run this entire script once after creating the Auth admin user.
-- Fixed: is_admin() is created after public.admin_users exists.


-- =========================================================================
-- BEGIN supabase\migrations\20260314100000_init_schema.sql
-- =========================================================================
-- Phase 3: Core schema for Portfolio - Villafuerte Charlotte
-- UUID PKs, FKs, timestamps, indexes, and publication/ordering fields.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_type') then
    create type public.project_type as enum (
      'Individual',
      'Group',
      'Capstone',
      'Academic'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'project_platform') then
    create type public.project_platform as enum (
      'Web',
      'Mobile',
      'Web and Mobile'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum (
      'Ongoing',
      'Completed',
      'Archived'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

-- is_admin() must be created after admin_users exists (SQL functions resolve relations at create time).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
      and is_active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  title text,
  short_intro text,
  bio text,
  career_objective text,
  specialization text,
  technical_interests text,
  profile_image_url text,
  email text,
  location text,
  birthdate date,
  gender text,
  religion text,
  birthplace text,
  nationality text,
  civil_status text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  short_description text,
  full_description text,
  objectives text,
  project_type public.project_type not null default 'Individual',
  platform public.project_platform not null default 'Web',
  role text,
  status public.project_status not null default 'Ongoing',
  start_date date,
  end_date date,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  github_url text,
  live_url text,
  docs_url text,
  video_url text,
  thumbnail_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_slug_unique unique (slug),
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint projects_dates_valid check (
    end_date is null or start_date is null or end_date >= start_date
  )
);

create table if not exists public.project_features (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_contributions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  image_url text not null,
  caption text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.technologies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  icon text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint technologies_name_unique unique (name)
);

create table if not exists public.project_technologies (
  project_id uuid not null references public.projects (id) on delete cascade,
  technology_id uuid not null references public.technologies (id) on delete cascade,
  primary key (project_id, technology_id)
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  icon text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint skills_name_category_unique unique (name, category)
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  achievements text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint experiences_dates_valid check (
    end_date is null or start_date is null or end_date >= start_date
  )
);

create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  degree text not null,
  institution text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint education_dates_valid check (
    end_date is null or start_date is null or end_date >= start_date
  )
);

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text not null,
  issued_at date,
  credential_url text,
  image_url text,
  category text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  file_url text not null,
  is_published boolean not null default false,
  uploaded_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint social_links_platform_unique unique (platform)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint contact_messages_email_format check (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  constraint contact_messages_name_length check (char_length(full_name) between 2 and 120),
  constraint contact_messages_subject_length check (char_length(subject) between 2 and 200),
  constraint contact_messages_message_length check (char_length(message) between 10 and 5000)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint site_settings_key_unique unique (key)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_projects_published_order
  on public.projects (is_published, display_order, created_at desc);

create index if not exists idx_projects_featured
  on public.projects (is_featured, display_order)
  where is_published = true;

create index if not exists idx_projects_slug
  on public.projects (slug);

create index if not exists idx_projects_status_type_platform
  on public.projects (status, project_type, platform);

create index if not exists idx_project_features_project_order
  on public.project_features (project_id, display_order);

create index if not exists idx_project_contributions_project_order
  on public.project_contributions (project_id, display_order);

create index if not exists idx_project_media_project_order
  on public.project_media (project_id, display_order);

create index if not exists idx_skills_category_order
  on public.skills (category, display_order);

create index if not exists idx_technologies_category_order
  on public.technologies (category, display_order);

create index if not exists idx_experiences_order
  on public.experiences (display_order, start_date desc nulls last);

create index if not exists idx_education_order
  on public.education (display_order, start_date desc nulls last);

create index if not exists idx_certifications_category_order
  on public.certifications (category, display_order);

create index if not exists idx_resumes_published
  on public.resumes (is_published, uploaded_at desc);

create index if not exists idx_social_links_visible_order
  on public.social_links (is_visible, display_order);

create index if not exists idx_contact_messages_unread
  on public.contact_messages (is_read, created_at desc);

create index if not exists idx_site_settings_key
  on public.site_settings (key);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_skills_updated_at on public.skills;
create trigger trg_skills_updated_at
before update on public.skills
for each row execute function public.set_updated_at();

drop trigger if exists trg_experiences_updated_at on public.experiences;
create trigger trg_experiences_updated_at
before update on public.experiences
for each row execute function public.set_updated_at();

drop trigger if exists trg_education_updated_at on public.education;
create trigger trg_education_updated_at
before update on public.education
for each row execute function public.set_updated_at();

drop trigger if exists trg_certifications_updated_at on public.certifications;
create trigger trg_certifications_updated_at
before update on public.certifications
for each row execute function public.set_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Bootstrap content shells (no invented project/skill/cert details)
-- ---------------------------------------------------------------------------

insert into public.profiles (full_name, email, title)
select 'Charlotte Villafuerte', 'charlottevillafuerte.w@gmail.com', 'IT Student / Aspiring Software Developer'
where not exists (select 1 from public.profiles);

insert into public.site_settings (key, value)
values
  ('homepage', '{"show_featured_projects": true, "show_highlighted_skills": true}'::jsonb),
  ('contact', '{"enable_form": true, "success_message": "Thank you. Your message has been sent."}'::jsonb)
on conflict (key) do nothing;

-- END supabase\migrations\20260314100000_init_schema.sql

-- =========================================================================
-- BEGIN supabase\migrations\20260314100001_rls_policies.sql
-- =========================================================================
-- Phase 3: Row Level Security
-- Public: read published/visible content only; insert contact messages.
-- Admin: full CRUD when public.is_admin() is true.
-- Private: contact messages and drafts never exposed publicly.

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.admin_users enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_features enable row level security;
alter table public.project_contributions enable row level security;
alter table public.project_media enable row level security;
alter table public.technologies enable row level security;
alter table public.project_technologies enable row level security;
alter table public.skills enable row level security;
alter table public.experiences enable row level security;
alter table public.education enable row level security;
alter table public.certifications enable row level security;
alter table public.resumes enable row level security;
alter table public.social_links enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;

-- ---------------------------------------------------------------------------
-- Helper: published project existence
-- ---------------------------------------------------------------------------

create or replace function public.is_published_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects
    where id = target_project_id
      and is_published = true
  );
$$;

revoke all on function public.is_published_project(uuid) from public;
grant execute on function public.is_published_project(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------

drop policy if exists "Admins can read admin_users" on public.admin_users;
create policy "Admins can read admin_users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage admin_users" on public.admin_users;
create policy "Admins can manage admin_users"
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read profiles" on public.profiles;
create policy "Public can read profiles"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
on public.projects
for select
to anon, authenticated
using (is_published = true or public.is_admin());

drop policy if exists "Admins can manage projects" on public.projects;
create policy "Admins can manage projects"
on public.projects
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- project_features
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read features of published projects" on public.project_features;
create policy "Public can read features of published projects"
on public.project_features
for select
to anon, authenticated
using (public.is_published_project(project_id) or public.is_admin());

drop policy if exists "Admins can manage project features" on public.project_features;
create policy "Admins can manage project features"
on public.project_features
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- project_contributions
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read contributions of published projects" on public.project_contributions;
create policy "Public can read contributions of published projects"
on public.project_contributions
for select
to anon, authenticated
using (public.is_published_project(project_id) or public.is_admin());

drop policy if exists "Admins can manage project contributions" on public.project_contributions;
create policy "Admins can manage project contributions"
on public.project_contributions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- project_media
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read media of published projects" on public.project_media;
create policy "Public can read media of published projects"
on public.project_media
for select
to anon, authenticated
using (public.is_published_project(project_id) or public.is_admin());

drop policy if exists "Admins can manage project media" on public.project_media;
create policy "Admins can manage project media"
on public.project_media
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- technologies
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read technologies" on public.technologies;
create policy "Public can read technologies"
on public.technologies
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage technologies" on public.technologies;
create policy "Admins can manage technologies"
on public.technologies
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- project_technologies
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read project technologies for published projects" on public.project_technologies;
create policy "Public can read project technologies for published projects"
on public.project_technologies
for select
to anon, authenticated
using (public.is_published_project(project_id) or public.is_admin());

drop policy if exists "Admins can manage project technologies" on public.project_technologies;
create policy "Admins can manage project technologies"
on public.project_technologies
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- skills
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read skills" on public.skills;
create policy "Public can read skills"
on public.skills
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage skills" on public.skills;
create policy "Admins can manage skills"
on public.skills
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- experiences
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read experiences" on public.experiences;
create policy "Public can read experiences"
on public.experiences
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage experiences" on public.experiences;
create policy "Admins can manage experiences"
on public.experiences
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- education
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read education" on public.education;
create policy "Public can read education"
on public.education
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage education" on public.education;
create policy "Admins can manage education"
on public.education
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- certifications
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read certifications" on public.certifications;
create policy "Public can read certifications"
on public.certifications
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage certifications" on public.certifications;
create policy "Admins can manage certifications"
on public.certifications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- resumes
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read published resumes" on public.resumes;
create policy "Public can read published resumes"
on public.resumes
for select
to anon, authenticated
using (is_published = true or public.is_admin());

drop policy if exists "Admins can manage resumes" on public.resumes;
create policy "Admins can manage resumes"
on public.resumes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- social_links
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read visible social links" on public.social_links;
create policy "Public can read visible social links"
on public.social_links
for select
to anon, authenticated
using (is_visible = true or public.is_admin());

drop policy if exists "Admins can manage social links" on public.social_links;
create policy "Admins can manage social links"
on public.social_links
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- contact_messages (private; public insert only)
-- ---------------------------------------------------------------------------

drop policy if exists "Anyone can submit contact messages" on public.contact_messages;
create policy "Anyone can submit contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
on public.contact_messages
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update contact messages" on public.contact_messages;
create policy "Admins can update contact messages"
on public.contact_messages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete contact messages" on public.contact_messages;
create policy "Admins can delete contact messages"
on public.contact_messages
for delete
to authenticated
using (public.is_admin());

-- ---------------------------------------------------------------------------
-- site_settings
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- END supabase\migrations\20260314100001_rls_policies.sql

-- =========================================================================
-- BEGIN supabase\migrations\20260314100002_storage.sql
-- =========================================================================
-- Phase 3: Storage buckets and policies
-- portfolio-media: public read, admin write (images, screenshots, certs, profile)
-- portfolio-resumes: public read for files under published use; admin write

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'portfolio-media',
    'portfolio-media',
    true,
    10485760,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml'
    ]
  ),
  (
    'portfolio-resumes',
    'portfolio-resumes',
    true,
    10485760,
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read
drop policy if exists "Public can read portfolio media" on storage.objects;
create policy "Public can read portfolio media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-media');

drop policy if exists "Public can read portfolio resumes" on storage.objects;
create policy "Public can read portfolio resumes"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-resumes');

-- Admin write/update/delete
drop policy if exists "Admins can upload portfolio media" on storage.objects;
create policy "Admins can upload portfolio media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('portfolio-media', 'portfolio-resumes')
  and public.is_admin()
);

drop policy if exists "Admins can update portfolio media" on storage.objects;
create policy "Admins can update portfolio media"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('portfolio-media', 'portfolio-resumes')
  and public.is_admin()
)
with check (
  bucket_id in ('portfolio-media', 'portfolio-resumes')
  and public.is_admin()
);

drop policy if exists "Admins can delete portfolio media" on storage.objects;
create policy "Admins can delete portfolio media"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('portfolio-media', 'portfolio-resumes')
  and public.is_admin()
);

-- END supabase\migrations\20260314100002_storage.sql

-- =========================================================================
-- BEGIN supabase\migrations\20260314100003_admin_bootstrap.sql
-- =========================================================================
-- Phase 3: Link the first administrator after the Auth user exists.
-- Safe to re-run: inserts only when the auth user is present and not already linked.

insert into public.admin_users (id, email, is_active)
select u.id, u.email, true
from auth.users u
where lower(u.email) = lower('charlottevillafuerte.w@gmail.com')
on conflict (id) do update
set
  email = excluded.email,
  is_active = true;

-- END supabase\migrations\20260314100003_admin_bootstrap.sql

-- =========================================================================
-- BEGIN supabase\migrations\20260314100004_contact_submit_rpc.sql
-- =========================================================================
-- Phase 3: Secure contact submission with basic rate limiting.
-- Frontend should still drop honeypot submissions client-side before calling this.

create or replace function public.submit_contact_message(
  p_full_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_honeypot text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_recent_count integer;
begin
  -- Bot trap: if honeypot is filled, pretend success without storing.
  if p_honeypot is not null and length(trim(p_honeypot)) > 0 then
    return gen_random_uuid();
  end if;

  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'Full name is required.';
  end if;

  if p_email is null or p_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'A valid email address is required.';
  end if;

  if p_subject is null or length(trim(p_subject)) < 2 then
    raise exception 'Subject is required.';
  end if;

  if p_message is null or length(trim(p_message)) < 10 then
    raise exception 'Message must be at least 10 characters.';
  end if;

  select count(*)
  into v_recent_count
  from public.contact_messages
  where lower(email) = lower(trim(p_email))
    and created_at > timezone('utc', now()) - interval '1 hour';

  if v_recent_count >= 3 then
    raise exception 'Too many messages submitted. Please try again later.';
  end if;

  insert into public.contact_messages (full_name, email, subject, message)
  values (
    trim(p_full_name),
    lower(trim(p_email)),
    trim(p_subject),
    trim(p_message)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;

-- END supabase\migrations\20260314100004_contact_submit_rpc.sql

-- =========================================================================
-- BEGIN supabase\migrations\20260314100005_hobbies_and_admin_fields.sql
-- =========================================================================
-- Hobbies & Interests + admin field extensions

alter table public.skills
  add column if not exists is_visible boolean not null default true;

alter table public.education
  add column if not exists specialization text;

create table if not exists public.hobbies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  short_description text,
  detailed_description text,
  icon text,
  cover_image_url text,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hobbies_name_length check (char_length(name) between 2 and 120),
  constraint hobbies_category_length check (char_length(category) between 2 and 80)
);

create table if not exists public.hobby_media (
  id uuid primary key default gen_random_uuid(),
  hobby_id uuid not null references public.hobbies (id) on delete cascade,
  image_url text not null,
  caption text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_hobbies_visible_order
  on public.hobbies (is_visible, display_order, created_at desc);

create index if not exists idx_hobbies_category
  on public.hobbies (category);

create index if not exists idx_hobby_media_hobby_order
  on public.hobby_media (hobby_id, display_order);

drop trigger if exists trg_hobbies_updated_at on public.hobbies;
create trigger trg_hobbies_updated_at
before update on public.hobbies
for each row
execute function public.set_updated_at();

alter table public.hobbies enable row level security;
alter table public.hobby_media enable row level security;

drop policy if exists "Public can read visible hobbies" on public.hobbies;
create policy "Public can read visible hobbies"
on public.hobbies
for select
to anon, authenticated
using (is_visible = true or public.is_admin());

drop policy if exists "Admins can manage hobbies" on public.hobbies;
create policy "Admins can manage hobbies"
on public.hobbies
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read visible hobby media" on public.hobby_media;
create policy "Public can read visible hobby media"
on public.hobby_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.hobbies h
    where h.id = hobby_id
      and (h.is_visible = true or public.is_admin())
  )
);

drop policy if exists "Admins can manage hobby media" on public.hobby_media;
create policy "Admins can manage hobby media"
on public.hobby_media
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- END supabase\migrations\20260314100005_hobbies_and_admin_fields.sql

-- =========================================================================
-- BEGIN supabase\migrations\20260314100006_certifications_visibility.sql
-- =========================================================================
-- Certifications visibility for admin CMS

alter table public.certifications
  add column if not exists is_visible boolean not null default true;

create index if not exists idx_certifications_visible_order
  on public.certifications (is_visible, display_order, issued_at desc);

drop policy if exists "Public can read certifications" on public.certifications;
create policy "Public can read certifications"
on public.certifications
for select
to anon, authenticated
using (is_visible = true or public.is_admin());


-- END supabase\migrations\20260314100006_certifications_visibility.sql

-- =========================================================================
-- BEGIN supabase\migrations\20260315000000_enable_public_realtime.sql
-- =========================================================================
-- Enable Supabase Realtime for public portfolio tables so the website
-- can refresh when admin CMS content changes.

do $$
declare
  tbl text;
  tables text[] := array[
    'profiles',
    'projects',
    'project_technologies',
    'technologies',
    'skills',
    'experiences',
    'education',
    'hobbies',
    'hobby_media',
    'certifications',
    'resumes',
    'social_links',
    'site_settings'
  ];
begin
  foreach tbl in array tables loop
    begin
      execute format(
        'alter publication supabase_realtime add table public.%I',
        tbl
      );
    exception
      when duplicate_object then
        null;
      when undefined_object then
        null;
    end;
  end loop;
end $$;

-- END supabase\migrations\20260315000000_enable_public_realtime.sql
-- =============================================================================
-- CMS architecture: page sections, section content, navigation, specialization
-- cards, skill categories, content revisions, visibility columns, RLS.
-- Additive only — does not delete existing portfolio data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Visibility columns for experience / education
-- ---------------------------------------------------------------------------

alter table public.experiences
  add column if not exists is_visible boolean not null default true;

alter table public.education
  add column if not exists is_visible boolean not null default true;

-- ---------------------------------------------------------------------------
-- skill_categories
-- ---------------------------------------------------------------------------

create table if not exists public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  label text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint skill_categories_name_unique unique (name)
);

create index if not exists idx_skill_categories_visible_order
  on public.skill_categories (is_visible, display_order);

drop trigger if exists trg_skill_categories_updated_at on public.skill_categories;
create trigger trg_skill_categories_updated_at
before update on public.skill_categories
for each row execute function public.set_updated_at();

-- Seed categories from existing skill rows + known filter set
insert into public.skill_categories (name, label, display_order, is_visible)
values
  ('Programming Languages', 'Programming Languages', 10, true),
  ('Frontend Development', 'Frontend Development', 20, true),
  ('Backend Development', 'Backend Development', 30, true),
  ('Mobile Development', 'Mobile Development', 40, true),
  ('Database Management', 'Database Management', 50, true),
  ('API and AI Integration', 'API & AI Integration', 60, true),
  ('Software Quality Assurance', 'Software QA', 70, true),
  ('System Analysis', 'System Analysis & PM', 80, true),
  ('Project Management', 'Project Management', 90, true),
  ('Development Tools', 'Development Tools', 100, true)
on conflict (name) do nothing;

insert into public.skill_categories (name, label, display_order, is_visible)
select distinct
  s.category,
  s.category,
  200 + row_number() over (order by s.category),
  true
from public.skills s
where s.category is not null
  and btrim(s.category) <> ''
  and not exists (
    select 1 from public.skill_categories sc where sc.name = s.category
  );

-- ---------------------------------------------------------------------------
-- page_sections (published section chrome + visibility)
-- ---------------------------------------------------------------------------

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  eyebrow text,
  heading text,
  subtitle text,
  is_visible boolean not null default true,
  is_locked boolean not null default false,
  display_order integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint page_sections_section_key_unique unique (section_key)
);

create index if not exists idx_page_sections_visible_order
  on public.page_sections (is_visible, display_order);

drop trigger if exists trg_page_sections_updated_at on public.page_sections;
create trigger trg_page_sections_updated_at
before update on public.page_sections
for each row execute function public.set_updated_at();

insert into public.page_sections
  (section_key, eyebrow, heading, subtitle, is_visible, is_locked, display_order)
values
  ('home', null, 'Home', null, true, true, 10),
  ('about', 'System Overview • 01', 'Bridging Business Logic & Engineering Rigor',
    'I analyze real-world workflows, map requirements into architectural specifications, and ship maintainable digital products that stand the test of scale.',
    true, false, 20),
  ('skills', 'Competency Grid • 02', 'Technical Skills & Proficiency Matrix',
    'Categorized overview of languages, runtimes, databases, and analysis frameworks from the live portfolio database.',
    true, false, 30),
  ('featured_projects', 'Selected Work • 03', 'Featured Projects',
    'Published projects marked as featured — architecture, role, and stack from the live database.',
    true, false, 40),
  ('projects', 'Archive • 04', 'All Projects',
    'Searchable archive of published work. Filters are generated from live project data.',
    true, true, 50),
  ('experience', 'Career Path • 05', 'Experience & Education',
    'Professional roles, leadership, and academic foundations.',
    true, false, 60),
  ('hobbies', 'Beyond Code • 06', 'Hobbies & Interests',
    'Personal interests and photo galleries outside of engineering work.',
    true, false, 70),
  ('certifications', 'Credentials • 07', 'Certifications & Achievements',
    'Verified credentials and professional milestones.',
    true, false, 80),
  ('contact', 'Connect • 08', 'Let''s Build Something Reliable',
    'Open to full-time roles, internships, and collaboration on thoughtful software systems.',
    true, true, 90)
on conflict (section_key) do nothing;

-- ---------------------------------------------------------------------------
-- section_content (published key/value configuration per section)
-- ---------------------------------------------------------------------------

create table if not exists public.section_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  content_key text not null,
  content_value text not null default '',
  content_type text not null default 'text',
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint section_content_unique unique (section_key, content_key),
  constraint section_content_type_check check (
    content_type in ('text', 'markdown', 'url', 'boolean', 'number', 'json')
  )
);

create index if not exists idx_section_content_section
  on public.section_content (section_key);

drop trigger if exists trg_section_content_updated_at on public.section_content;
create trigger trg_section_content_updated_at
before update on public.section_content
for each row execute function public.set_updated_at();

insert into public.section_content (section_key, content_key, content_value, content_type)
values
  -- Hero
  ('hero', 'eyebrow', 'Available for Full-Time Roles & Internships', 'text'),
  ('hero', 'headline', 'Crafting Resilient Systems with Purpose.', 'text'),
  ('hero', 'headline_accent', 'Resilient Systems', 'text'),
  ('hero', 'show_availability', 'true', 'boolean'),
  ('hero', 'primary_cta_label', 'View My Projects', 'text'),
  ('hero', 'primary_cta_href', '#featured-projects', 'url'),
  ('hero', 'secondary_cta_label', 'Download Resume', 'text'),
  ('hero', 'secondary_cta_href', 'resume', 'url'),
  ('hero', 'show_github', 'true', 'boolean'),
  ('hero', 'show_linkedin', 'true', 'boolean'),
  ('hero', 'stat_specialization_label', 'Specialization', 'text'),
  ('hero', 'stat_projects_label', 'Systems Built', 'text'),
  ('hero', 'stat_projects_subtext', 'Production & Academic', 'text'),
  ('hero', 'stat_focus_label', 'Focus', 'text'),
  ('hero', 'stat_focus_value', 'Full-Stack', 'text'),
  ('hero', 'stat_focus_subtext', 'Systems & QA', 'text'),
  ('hero', 'terminal_prompt', 'charlotte@arch-node:~', 'text'),
  ('hero', 'live_chip_label', 'Live Portfolio Data', 'text'),
  ('hero', 'config_filename', 'developer.config.json', 'text'),
  ('hero', 'config_key_engineer', 'engineer', 'text'),
  ('hero', 'config_engineer', '', 'text'),
  ('hero', 'config_key_status', 'status', 'text'),
  ('hero', 'config_status', 'Open to Work', 'text'),
  ('hero', 'config_key_focus', 'focus', 'text'),
  ('hero', 'config_focus', '', 'text'),
  ('hero', 'config_key_ready', 'readyForDeployment', 'text'),
  ('hero', 'config_ready', 'true', 'boolean'),
  -- About
  ('about', 'card_heading', 'Architecting Systems that Scale & Endure', 'text'),
  ('about', 'card_description', '', 'text'),
  ('about', 'vitals_heading', 'Profile Vitals', 'text'),
  ('about', 'show_vitals', 'true', 'boolean'),
  ('about', 'work_model', 'Hybrid / Remote / On-Site', 'text'),
  -- Experience section column labels live under experience key
  ('experience', 'experience_column_heading', 'Professional Experience', 'text'),
  ('experience', 'education_column_heading', 'Education', 'text'),
  ('experience', 'highlights_heading', 'Highlights', 'text'),
  -- Header
  ('header', 'display_name', '', 'text'),
  ('header', 'subtitle', '', 'text'),
  ('header', 'resume_label', 'Resume', 'text'),
  ('header', 'show_resume', 'true', 'boolean'),
  ('header', 'show_theme_toggle', 'true', 'boolean'),
  ('header', 'logo_url', '', 'url'),
  -- Footer
  ('footer', 'display_name', '', 'text'),
  ('footer', 'intro', '', 'text'),
  ('footer', 'availability_badge', 'Available for hire / Internships', 'text'),
  ('footer', 'show_availability_badge', 'true', 'boolean'),
  ('footer', 'show_email', 'true', 'boolean'),
  ('footer', 'show_admin_link', 'true', 'boolean'),
  ('footer', 'show_back_to_top', 'true', 'boolean'),
  ('footer', 'copyright_text', 'Engineered with precision.', 'text'),
  ('footer', 'custom_copyright_year', '', 'text'),
  ('footer', 'index_heading', 'Index', 'text'),
  ('footer', 'connect_heading', 'Connect', 'text'),
  -- Floating actions
  ('floating_actions', 'contact_label', 'Hire Charlotte', 'text'),
  ('floating_actions', 'show_contact', 'true', 'boolean'),
  ('floating_actions', 'contact_href', '#contact', 'url'),
  ('floating_actions', 'show_back_to_top', 'true', 'boolean'),
  ('floating_actions', 'position', 'bottom-right', 'text'),
  ('floating_actions', 'show_realtime_indicator', 'true', 'boolean'),
  -- Contact
  ('contact', 'form_heading', 'Send a Message', 'text'),
  ('contact', 'submit_label', 'Send Message', 'text'),
  ('contact', 'error_message', 'Something went wrong. Please try again.', 'text'),
  ('contact', 'response_time_text', 'Response Time: Typically within 24 hours', 'text'),
  ('contact', 'opportunity_options', '["Full-Time Role","Internship","Freelance / Contract","Collaboration","Other"]', 'json'),
  ('contact', 'show_form', 'true', 'boolean'),
  -- Featured
  ('featured_projects', 'featured_limit', '6', 'number'),
  -- Hobbies empty state
  ('hobbies', 'show_when_empty', 'false', 'boolean'),
  ('hobbies', 'empty_state_message', '', 'text')
on conflict (section_key, content_key) do nothing;

-- ---------------------------------------------------------------------------
-- specialization_cards
-- ---------------------------------------------------------------------------

create table if not exists public.specialization_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  icon text not null default 'widgets',
  tone text not null default 'bg-primary-fixed text-primary-container',
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.specialization_card_skills (
  card_id uuid not null references public.specialization_cards (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (card_id, skill_id)
);

create index if not exists idx_specialization_cards_visible_order
  on public.specialization_cards (is_visible, display_order);

drop trigger if exists trg_specialization_cards_updated_at on public.specialization_cards;
create trigger trg_specialization_cards_updated_at
before update on public.specialization_cards
for each row execute function public.set_updated_at();

insert into public.specialization_cards (title, description, icon, tone, display_order, is_visible)
select * from (
  values
    (
      'Web & Mobile Development',
      'Building performant web interfaces and cross-platform mobile apps with adaptive layouts and offline-first persistence.',
      'devices',
      'bg-primary-fixed text-primary-container',
      10,
      true
    ),
    (
      'System Analysis & SQA',
      'Translating complex workflows into SRS documentation, ERDs, UML diagrams, and automated regression test pipelines.',
      'fact_check',
      'bg-secondary-container text-secondary',
      20,
      true
    ),
    (
      'API & AI Integration',
      'Designing relational schemas and chaining LLM endpoints for intelligent data enrichment and agent assistants.',
      'neurology',
      'bg-tertiary-fixed text-tertiary',
      30,
      true
    )
) as v(title, description, icon, tone, display_order, is_visible)
where not exists (select 1 from public.specialization_cards limit 1);

-- ---------------------------------------------------------------------------
-- navigation_items
-- ---------------------------------------------------------------------------

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  destination text not null,
  location text not null default 'header',
  section_key text,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint navigation_items_location_check check (
    location in ('header', 'footer', 'mobile')
  )
);

create index if not exists idx_navigation_items_location_order
  on public.navigation_items (location, is_visible, display_order);

drop trigger if exists trg_navigation_items_updated_at on public.navigation_items;
create trigger trg_navigation_items_updated_at
before update on public.navigation_items
for each row execute function public.set_updated_at();

insert into public.navigation_items
  (label, destination, location, section_key, is_visible, display_order)
select * from (
  values
    ('Home', '#home', 'header', 'home', true, 10),
    ('About', '#about', 'header', 'about', true, 20),
    ('Skills', '#skills', 'header', 'skills', true, 30),
    ('Projects', '#featured-projects', 'header', 'featured_projects', true, 40),
    ('Experience', '#experience', 'header', 'experience', true, 50),
    ('Hobbies', '#hobbies', 'header', 'hobbies', true, 55),
    ('Certifications', '#certifications', 'header', 'certifications', true, 60),
    ('Contact', '#contact', 'header', 'contact', true, 70),
    ('Home & Summary', '#home', 'footer', 'home', true, 10),
    ('About & Core Focus', '#about', 'footer', 'about', true, 20),
    ('Technical Skills', '#skills', 'footer', 'skills', true, 30),
    ('Featured Projects', '#featured-projects', 'footer', 'featured_projects', true, 40),
    ('Experience & Leadership', '#experience', 'footer', 'experience', true, 50)
) as v(label, destination, location, section_key, is_visible, display_order)
where not exists (select 1 from public.navigation_items limit 1);

-- ---------------------------------------------------------------------------
-- content_revisions (drafts / publish history — never public)
-- ---------------------------------------------------------------------------

create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_key text not null,
  status text not null default 'draft',
  payload jsonb not null default '{}'::jsonb,
  label text,
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint content_revisions_status_check check (
    status in ('draft', 'published', 'archived')
  ),
  constraint content_revisions_entity_type_check check (
    entity_type in (
      'page_section',
      'section_bundle',
      'site_setting',
      'navigation',
      'specialization_cards',
      'header',
      'footer',
      'floating_actions',
      'hero',
      'about',
      'contact'
    )
  )
);

create unique index if not exists idx_content_revisions_active_draft
  on public.content_revisions (entity_type, entity_key)
  where status = 'draft';

create index if not exists idx_content_revisions_entity
  on public.content_revisions (entity_type, entity_key, updated_at desc);

drop trigger if exists trg_content_revisions_updated_at on public.content_revisions;
create trigger trg_content_revisions_updated_at
before update on public.content_revisions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Expand homepage settings defaults (merge-safe upsert)
-- ---------------------------------------------------------------------------

insert into public.site_settings (key, value)
values (
  'homepage',
  '{
    "show_featured_projects": true,
    "show_highlighted_skills": true,
    "show_hobbies": true,
    "show_certifications": true,
    "show_about": true,
    "show_experience": true,
    "featured_limit": 6
  }'::jsonb
)
on conflict (key) do update
set value = public.site_settings.value || excluded.value
where public.site_settings.value ? 'show_featured_projects';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.skill_categories enable row level security;
alter table public.page_sections enable row level security;
alter table public.section_content enable row level security;
alter table public.specialization_cards enable row level security;
alter table public.specialization_card_skills enable row level security;
alter table public.navigation_items enable row level security;
alter table public.content_revisions enable row level security;

-- skill_categories: public reads visible; admin manages
drop policy if exists "Public can read visible skill categories" on public.skill_categories;
create policy "Public can read visible skill categories"
on public.skill_categories for select
to anon, authenticated
using (is_visible = true or public.is_admin());

drop policy if exists "Admins can manage skill categories" on public.skill_categories;
create policy "Admins can manage skill categories"
on public.skill_categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- page_sections
drop policy if exists "Public can read page sections" on public.page_sections;
create policy "Public can read page sections"
on public.page_sections for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage page sections" on public.page_sections;
create policy "Admins can manage page sections"
on public.page_sections for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- section_content (published only in this table)
drop policy if exists "Public can read section content" on public.section_content;
create policy "Public can read section content"
on public.section_content for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage section content" on public.section_content;
create policy "Admins can manage section content"
on public.section_content for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- specialization_cards
drop policy if exists "Public can read visible specialization cards" on public.specialization_cards;
create policy "Public can read visible specialization cards"
on public.specialization_cards for select
to anon, authenticated
using (is_visible = true or public.is_admin());

drop policy if exists "Admins can manage specialization cards" on public.specialization_cards;
create policy "Admins can manage specialization cards"
on public.specialization_cards for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read specialization card skills" on public.specialization_card_skills;
create policy "Public can read specialization card skills"
on public.specialization_card_skills for select
to anon, authenticated
using (
  exists (
    select 1 from public.specialization_cards c
    where c.id = card_id and (c.is_visible = true or public.is_admin())
  )
);

drop policy if exists "Admins can manage specialization card skills" on public.specialization_card_skills;
create policy "Admins can manage specialization card skills"
on public.specialization_card_skills for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- navigation_items
drop policy if exists "Public can read visible navigation items" on public.navigation_items;
create policy "Public can read visible navigation items"
on public.navigation_items for select
to anon, authenticated
using (is_visible = true or public.is_admin());

drop policy if exists "Admins can manage navigation items" on public.navigation_items;
create policy "Admins can manage navigation items"
on public.navigation_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- content_revisions: admin only (drafts never public)
drop policy if exists "Admins can manage content revisions" on public.content_revisions;
create policy "Admins can manage content revisions"
on public.content_revisions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Tighten skills public read to visible rows
drop policy if exists "Public can read skills" on public.skills;
create policy "Public can read skills"
on public.skills for select
to anon, authenticated
using (is_visible = true or public.is_admin());

-- Experiences / education visibility
drop policy if exists "Public can read experiences" on public.experiences;
create policy "Public can read experiences"
on public.experiences for select
to anon, authenticated
using (is_visible = true or public.is_admin());

drop policy if exists "Public can read education" on public.education;
create policy "Public can read education"
on public.education for select
to anon, authenticated
using (is_visible = true or public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime publication (optional; ignore if already added)
-- ---------------------------------------------------------------------------

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'page_sections',
    'section_content',
    'specialization_cards',
    'navigation_items',
    'skill_categories'
  ]
  loop
    begin
      execute format(
        'alter publication supabase_realtime add table public.%I',
        tbl
      );
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end $$;

-- END supabase\migrations\20260316000000_cms_architecture.sql


-- BEGIN supabase\migrations\20260317000000_education_training_hobbies_awards.sql

-- =============================================================================
-- Education levels/degrees, training records, hobby catalogs, awards,
-- certification TESDA fields, media metadata. Additive — preserves rows.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Reference: education_levels
-- ---------------------------------------------------------------------------

create table if not exists public.education_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint education_levels_slug_unique unique (slug),
  constraint education_levels_name_unique unique (name)
);

create index if not exists idx_education_levels_order
  on public.education_levels (is_visible, display_order);

drop trigger if exists trg_education_levels_updated_at on public.education_levels;
create trigger trg_education_levels_updated_at
before update on public.education_levels
for each row execute function public.set_updated_at();

insert into public.education_levels (name, slug, display_order) values
  ('Elementary / Primary Education', 'elementary', 10),
  ('Junior High School', 'junior-high', 20),
  ('Senior High School', 'senior-high', 30),
  ('Vocational / Technical Education', 'vocational', 40),
  ('Associate Degree', 'associate', 50),
  ('Bachelor''s Degree', 'bachelors', 60),
  ('Postgraduate Diploma / Certificate', 'postgrad-diploma', 70),
  ('Master''s Degree', 'masters', 80),
  ('Doctoral Degree (PhD / EdD / DBA)', 'doctoral', 90),
  ('Postdoctoral Studies', 'postdoctoral', 100),
  ('Other', 'other', 999)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Reference: education_tracks / education_strands (SHS)
-- ---------------------------------------------------------------------------

create table if not exists public.education_tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint education_tracks_slug_unique unique (slug),
  constraint education_tracks_name_unique unique (name)
);

drop trigger if exists trg_education_tracks_updated_at on public.education_tracks;
create trigger trg_education_tracks_updated_at
before update on public.education_tracks
for each row execute function public.set_updated_at();

insert into public.education_tracks (name, slug, display_order) values
  ('Academic Track', 'academic', 10),
  ('Technical-Vocational-Livelihood (TVL)', 'tvl', 20),
  ('Arts and Design', 'arts-design', 30),
  ('Sports Track', 'sports', 40),
  ('Other', 'other', 999)
on conflict (slug) do nothing;

create table if not exists public.education_strands (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references public.education_tracks (id) on delete set null,
  name text not null,
  slug text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint education_strands_slug_unique unique (slug)
);

create index if not exists idx_education_strands_track
  on public.education_strands (track_id, display_order);

drop trigger if exists trg_education_strands_updated_at on public.education_strands;
create trigger trg_education_strands_updated_at
before update on public.education_strands
for each row execute function public.set_updated_at();

insert into public.education_strands (name, slug, track_id, display_order)
select v.name, v.slug, t.id, v.display_order
from (values
  ('STEM', 'stem', 'academic', 10),
  ('ABM', 'abm', 'academic', 20),
  ('HUMSS', 'humss', 'academic', 30),
  ('GAS', 'gas', 'academic', 40),
  ('TVL', 'tvl-strand', 'tvl', 50),
  ('Arts and Design', 'arts-design-strand', 'arts-design', 60),
  ('Sports Track', 'sports-strand', 'sports', 70),
  ('Other', 'other-strand', null, 999)
) as v(name, slug, track_slug, display_order)
left join public.education_tracks t on t.slug = v.track_slug
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Reference: degree_options (category-dependent)
-- ---------------------------------------------------------------------------

create table if not exists public.degree_options (
  id uuid primary key default gen_random_uuid(),
  education_level_id uuid not null references public.education_levels (id) on delete cascade,
  name text not null,
  slug text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  is_custom boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint degree_options_level_slug_unique unique (education_level_id, slug)
);

create index if not exists idx_degree_options_level
  on public.degree_options (education_level_id, display_order);

drop trigger if exists trg_degree_options_updated_at on public.degree_options;
create trigger trg_degree_options_updated_at
before update on public.degree_options
for each row execute function public.set_updated_at();

insert into public.degree_options (education_level_id, name, slug, display_order)
select l.id, v.name, v.slug, v.display_order
from (values
  ('junior-high', 'Junior High School Completion', 'jhs-completion', 10),
  ('junior-high', 'Other', 'other', 999),
  ('senior-high', 'STEM', 'shs-stem', 10),
  ('senior-high', 'ABM', 'shs-abm', 20),
  ('senior-high', 'HUMSS', 'shs-humss', 30),
  ('senior-high', 'GAS', 'shs-gas', 40),
  ('senior-high', 'TVL', 'shs-tvl', 50),
  ('senior-high', 'Arts and Design', 'shs-arts', 60),
  ('senior-high', 'Sports Track', 'shs-sports', 70),
  ('senior-high', 'Other', 'other', 999),
  ('associate', 'Associate in Computer Technology', 'act', 10),
  ('associate', 'Associate in Information Technology', 'ait', 20),
  ('associate', 'Other', 'other', 999),
  ('bachelors', 'Bachelor of Science in Information Technology', 'bsit', 10),
  ('bachelors', 'Bachelor of Science in Computer Science', 'bscs', 20),
  ('bachelors', 'Bachelor of Science in Information Systems', 'bsis', 30),
  ('bachelors', 'Bachelor of Science in Computer Engineering', 'bscpe', 40),
  ('bachelors', 'Bachelor of Science in Business Administration', 'bsba', 50),
  ('bachelors', 'Bachelor of Science in Accountancy', 'bsa', 60),
  ('bachelors', 'Bachelor of Arts', 'ba', 70),
  ('bachelors', 'Other', 'other', 999),
  ('masters', 'Master of Science in Information Technology', 'msit', 10),
  ('masters', 'Master of Science in Computer Science', 'mscs', 20),
  ('masters', 'Master in Information Systems', 'mis', 30),
  ('masters', 'Master in Business Administration', 'mba', 40),
  ('masters', 'Master of Arts', 'ma', 50),
  ('masters', 'Other', 'other', 999),
  ('doctoral', 'Doctor of Philosophy', 'phd', 10),
  ('doctoral', 'Doctor of Education', 'edd', 20),
  ('doctoral', 'Doctor of Business Administration', 'dba', 30),
  ('doctoral', 'Other', 'other', 999),
  ('vocational', 'Other', 'other', 999),
  ('postgrad-diploma', 'Other', 'other', 999),
  ('postdoctoral', 'Other', 'other', 999),
  ('elementary', 'Other', 'other', 999),
  ('other', 'Other', 'other', 999)
) as v(level_slug, name, slug, display_order)
join public.education_levels l on l.slug = v.level_slug
on conflict (education_level_id, slug) do nothing;

-- ---------------------------------------------------------------------------
-- Reference: hobby_categories / hobby_options
-- ---------------------------------------------------------------------------

create table if not exists public.hobby_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  is_custom boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hobby_categories_slug_unique unique (slug),
  constraint hobby_categories_name_unique unique (name)
);

drop trigger if exists trg_hobby_categories_updated_at on public.hobby_categories;
create trigger trg_hobby_categories_updated_at
before update on public.hobby_categories
for each row execute function public.set_updated_at();

insert into public.hobby_categories (name, slug, display_order) values
  ('Sports & Fitness', 'sports-fitness', 10),
  ('Arts & Creativity', 'arts-creativity', 20),
  ('Photography & Media', 'photography-media', 30),
  ('Technology & Gaming', 'technology-gaming', 40),
  ('Music & Performing Arts', 'music-performing', 50),
  ('Travel & Outdoors', 'travel-outdoors', 60),
  ('Reading & Learning', 'reading-learning', 70),
  ('Lifestyle & Wellness', 'lifestyle-wellness', 80),
  ('Community & Volunteering', 'community-volunteering', 90),
  ('Other', 'other', 999)
on conflict (slug) do nothing;

-- Backfill legacy hardcoded categories if still used on hobbies
insert into public.hobby_categories (name, slug, display_order, is_custom)
select distinct
  h.category,
  lower(regexp_replace(trim(h.category), '[^a-zA-Z0-9]+', '-', 'g')),
  200,
  true
from public.hobbies h
where h.category is not null
  and btrim(h.category) <> ''
  and not exists (
    select 1 from public.hobby_categories c where lower(c.name) = lower(h.category)
  )
on conflict (slug) do nothing;

create table if not exists public.hobby_options (
  id uuid primary key default gen_random_uuid(),
  hobby_category_id uuid not null references public.hobby_categories (id) on delete cascade,
  name text not null,
  slug text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  is_custom boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hobby_options_category_slug_unique unique (hobby_category_id, slug),
  constraint hobby_options_category_name_unique unique (hobby_category_id, name)
);

create index if not exists idx_hobby_options_category
  on public.hobby_options (hobby_category_id, display_order);

drop trigger if exists trg_hobby_options_updated_at on public.hobby_options;
create trigger trg_hobby_options_updated_at
before update on public.hobby_options
for each row execute function public.set_updated_at();

insert into public.hobby_options (hobby_category_id, name, slug, display_order)
select c.id, v.name, v.slug, v.display_order
from (values
  ('sports-fitness', 'Volleyball', 'volleyball', 10),
  ('sports-fitness', 'Badminton', 'badminton', 20),
  ('sports-fitness', 'Basketball', 'basketball', 30),
  ('sports-fitness', 'Football', 'football', 40),
  ('sports-fitness', 'Running', 'running', 50),
  ('sports-fitness', 'Cycling', 'cycling', 60),
  ('sports-fitness', 'Swimming', 'swimming', 70),
  ('sports-fitness', 'Gym / Fitness', 'gym-fitness', 80),
  ('sports-fitness', 'Martial Arts', 'martial-arts', 90),
  ('sports-fitness', 'Other', 'other', 999),
  ('arts-creativity', 'Drawing', 'drawing', 10),
  ('arts-creativity', 'Painting', 'painting', 20),
  ('arts-creativity', 'Graphic Design', 'graphic-design', 30),
  ('arts-creativity', 'Digital Art', 'digital-art', 40),
  ('arts-creativity', 'Crafting', 'crafting', 50),
  ('arts-creativity', 'Other', 'other', 999),
  ('photography-media', 'Photography', 'photography', 10),
  ('photography-media', 'Videography', 'videography', 20),
  ('photography-media', 'Photo Editing', 'photo-editing', 30),
  ('photography-media', 'Video Editing', 'video-editing', 40),
  ('photography-media', 'Content Creation', 'content-creation', 50),
  ('photography-media', 'Other', 'other', 999),
  ('technology-gaming', 'Programming', 'programming', 10),
  ('technology-gaming', 'Game Development', 'game-development', 20),
  ('technology-gaming', 'Video Games', 'video-games', 30),
  ('technology-gaming', 'Robotics', 'robotics', 40),
  ('technology-gaming', 'Other', 'other', 999),
  ('music-performing', 'Singing', 'singing', 10),
  ('music-performing', 'Dancing', 'dancing', 20),
  ('music-performing', 'Guitar', 'guitar', 30),
  ('music-performing', 'Piano', 'piano', 40),
  ('music-performing', 'Other', 'other', 999),
  ('travel-outdoors', 'Traveling', 'traveling', 10),
  ('travel-outdoors', 'Hiking', 'hiking', 20),
  ('travel-outdoors', 'Camping', 'camping', 30),
  ('travel-outdoors', 'Nature Exploration', 'nature-exploration', 40),
  ('travel-outdoors', 'Other', 'other', 999),
  ('reading-learning', 'Reading', 'reading', 10),
  ('reading-learning', 'Writing', 'writing', 20),
  ('reading-learning', 'Language Learning', 'language-learning', 30),
  ('reading-learning', 'Other', 'other', 999),
  ('lifestyle-wellness', 'Cooking', 'cooking', 10),
  ('lifestyle-wellness', 'Baking', 'baking', 20),
  ('lifestyle-wellness', 'Gardening', 'gardening', 30),
  ('lifestyle-wellness', 'Other', 'other', 999),
  ('community-volunteering', 'Community Service', 'community-service', 10),
  ('community-volunteering', 'Volunteer Work', 'volunteer-work', 20),
  ('community-volunteering', 'Youth Leadership', 'youth-leadership', 30),
  ('community-volunteering', 'Other', 'other', 999),
  ('other', 'Other', 'other', 999)
) as v(category_slug, name, slug, display_order)
join public.hobby_categories c on c.slug = v.category_slug
on conflict (hobby_category_id, slug) do nothing;

-- ---------------------------------------------------------------------------
-- Reference: award_categories
-- ---------------------------------------------------------------------------

create table if not exists public.award_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  is_custom boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint award_categories_slug_unique unique (slug),
  constraint award_categories_name_unique unique (name)
);

drop trigger if exists trg_award_categories_updated_at on public.award_categories;
create trigger trg_award_categories_updated_at
before update on public.award_categories
for each row execute function public.set_updated_at();

insert into public.award_categories (name, slug, display_order) values
  ('Academic Honor', 'academic-honor', 10),
  ('Sports Achievement', 'sports-achievement', 20),
  ('Leadership Award', 'leadership-award', 30),
  ('Technical Competition', 'technical-competition', 40),
  ('Research Achievement', 'research-achievement', 50),
  ('Community Recognition', 'community-recognition', 60),
  ('Scholarship', 'scholarship', 70),
  ('Professional Recognition', 'professional-recognition', 80),
  ('Other', 'other', 999)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Alter education
-- ---------------------------------------------------------------------------

alter table public.education
  add column if not exists education_level_id uuid references public.education_levels (id) on delete set null,
  add column if not exists custom_education_level text,
  add column if not exists degree_option_id uuid references public.degree_options (id) on delete set null,
  add column if not exists school_address text,
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists country text,
  add column if not exists school_logo_url text,
  add column if not exists track_id uuid references public.education_tracks (id) on delete set null,
  add column if not exists strand_id uuid references public.education_strands (id) on delete set null,
  add column if not exists custom_track text,
  add column if not exists custom_strand text,
  add column if not exists academic_highlights text,
  add column if not exists status text not null default 'completed',
  add column if not exists expected_graduation date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'education_status_check'
  ) then
    alter table public.education
      add constraint education_status_check
      check (status in (
        'currently_studying',
        'completed',
        'incomplete',
        'discontinued',
        'on_hold'
      ));
  end if;
end $$;

-- Sync is_current from status for existing rows
update public.education
set status = case when is_current then 'currently_studying' else 'completed' end
where status is null
   or (is_current = true and status <> 'currently_studying')
   or (is_current = false and status = 'currently_studying' and end_date is not null);

-- ---------------------------------------------------------------------------
-- Alter hobbies / hobby_media
-- ---------------------------------------------------------------------------

alter table public.hobbies
  add column if not exists hobby_category_id uuid references public.hobby_categories (id) on delete set null,
  add column if not exists hobby_option_id uuid references public.hobby_options (id) on delete set null;

update public.hobbies h
set hobby_category_id = c.id
from public.hobby_categories c
where h.hobby_category_id is null
  and lower(c.name) = lower(h.category);

alter table public.hobby_media
  add column if not exists alt_text text;

-- ---------------------------------------------------------------------------
-- Training records
-- ---------------------------------------------------------------------------

create table if not exists public.training_records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider text not null,
  training_type text not null default 'TESDA Training',
  qualification_code text,
  description text,
  location text,
  start_date date,
  completion_date date,
  is_current boolean not null default false,
  expected_completion date,
  training_hours numeric(8, 2),
  completion_status text not null default 'completed',
  document_url text,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint training_type_check check (training_type in (
    'TESDA Training',
    'Short Course',
    'Bootcamp',
    'Workshop',
    'Seminar',
    'Professional Development',
    'Other'
  )),
  constraint training_status_check check (completion_status in (
    'currently_attending',
    'completed',
    'incomplete',
    'discontinued',
    'on_hold'
  )),
  constraint training_dates_valid check (
    completion_date is null
    or start_date is null
    or completion_date >= start_date
  )
);

create index if not exists idx_training_records_visible_order
  on public.training_records (is_visible, display_order);

drop trigger if exists trg_training_records_updated_at on public.training_records;
create trigger trg_training_records_updated_at
before update on public.training_records
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Alter certifications (TESDA + training link)
-- ---------------------------------------------------------------------------

alter table public.certifications
  add column if not exists certification_type text,
  add column if not exists qualification_name text,
  add column if not exists credential_number text,
  add column if not exists expires_at date,
  add column if not exists show_credential_number boolean not null default false,
  add column if not exists training_record_id uuid references public.training_records (id) on delete set null,
  add column if not exists document_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'certifications_type_check'
  ) then
    alter table public.certifications
      add constraint certifications_type_check
      check (
        certification_type is null
        or certification_type in (
          'National Certificate I (NC I)',
          'National Certificate II (NC II)',
          'National Certificate III (NC III)',
          'National Certificate IV (NC IV)',
          'Certificate of Competency (COC)',
          'Training Certificate',
          'Other'
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Awards
-- ---------------------------------------------------------------------------

create table if not exists public.awards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  award_category_id uuid references public.award_categories (id) on delete set null,
  custom_category text,
  issuer text,
  description text,
  received_at date,
  education_id uuid references public.education (id) on delete set null,
  experience_id uuid references public.experiences (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  image_url text,
  credential_url text,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_awards_visible_order
  on public.awards (is_visible, display_order);

drop trigger if exists trg_awards_updated_at on public.awards;
create trigger trg_awards_updated_at
before update on public.awards
for each row execute function public.set_updated_at();

create table if not exists public.education_awards (
  education_id uuid not null references public.education (id) on delete cascade,
  award_id uuid not null references public.awards (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (education_id, award_id)
);

-- ---------------------------------------------------------------------------
-- Media assets metadata (optional index for library)
-- ---------------------------------------------------------------------------

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  storage_path text not null,
  public_url text,
  file_name text not null,
  mime_type text,
  file_size bigint,
  alt_text text,
  caption text,
  folder text,
  is_public boolean not null default true,
  uploaded_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint media_assets_bucket_path_unique unique (bucket, storage_path)
);

drop trigger if exists trg_media_assets_updated_at on public.media_assets;
create trigger trg_media_assets_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Site settings flags for certifications / awards visibility groups
-- ---------------------------------------------------------------------------

insert into public.site_settings (key, value)
values
  ('show_certifications_group', 'true'::jsonb),
  ('show_awards_group', 'true'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.education_levels enable row level security;
alter table public.degree_options enable row level security;
alter table public.education_tracks enable row level security;
alter table public.education_strands enable row level security;
alter table public.hobby_categories enable row level security;
alter table public.hobby_options enable row level security;
alter table public.award_categories enable row level security;
alter table public.training_records enable row level security;
alter table public.awards enable row level security;
alter table public.education_awards enable row level security;
alter table public.media_assets enable row level security;

-- Reference catalogs: public read visible; admin manage
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'education_levels',
    'degree_options',
    'education_tracks',
    'education_strands',
    'hobby_categories',
    'hobby_options',
    'award_categories'
  ]
  loop
    execute format(
      'drop policy if exists "Public can read visible %1$s" on public.%1$I',
      tbl
    );
    execute format(
      'create policy "Public can read visible %1$s" on public.%1$I for select to anon, authenticated using (is_visible = true or public.is_admin())',
      tbl
    );
    execute format(
      'drop policy if exists "Admins can manage %1$s" on public.%1$I',
      tbl
    );
    execute format(
      'create policy "Admins can manage %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      tbl
    );
  end loop;
end $$;

drop policy if exists "Public can read visible training records" on public.training_records;
create policy "Public can read visible training records"
on public.training_records for select
to anon, authenticated
using (is_visible = true or public.is_admin());

drop policy if exists "Admins can manage training records" on public.training_records;
create policy "Admins can manage training records"
on public.training_records for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read visible awards" on public.awards;
create policy "Public can read visible awards"
on public.awards for select
to anon, authenticated
using (is_visible = true or public.is_admin());

drop policy if exists "Admins can manage awards" on public.awards;
create policy "Admins can manage awards"
on public.awards for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read education awards" on public.education_awards;
create policy "Public can read education awards"
on public.education_awards for select
to anon, authenticated
using (
  exists (
    select 1 from public.awards a
    where a.id = award_id and (a.is_visible = true or public.is_admin())
  )
);

drop policy if exists "Admins can manage education awards" on public.education_awards;
create policy "Admins can manage education awards"
on public.education_awards for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read public media assets" on public.media_assets;
create policy "Public can read public media assets"
on public.media_assets for select
to anon, authenticated
using (is_public = true or public.is_admin());

drop policy if exists "Admins can manage media assets" on public.media_assets;
create policy "Admins can manage media assets"
on public.media_assets for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- END supabase\migrations\20260317000000_education_training_hobbies_awards.sql


-- BEGIN supabase\migrations\20260317000001_education_date_precision.sql

-- Allow education timeline dates to be year-only or month+year.
-- Stored dates remain PostgreSQL dates (first of month / Jan 1);
-- precision columns control display and admin round-trip.

alter table public.education
  add column if not exists start_date_precision text not null default 'month',
  add column if not exists end_date_precision text not null default 'month',
  add column if not exists expected_graduation_precision text not null default 'month';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'education_start_date_precision_check'
  ) then
    alter table public.education
      add constraint education_start_date_precision_check
      check (start_date_precision in ('year', 'month'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'education_end_date_precision_check'
  ) then
    alter table public.education
      add constraint education_end_date_precision_check
      check (end_date_precision in ('year', 'month'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'education_expected_graduation_precision_check'
  ) then
    alter table public.education
      add constraint education_expected_graduation_precision_check
      check (expected_graduation_precision in ('year', 'month'));
  end if;
end $$;

-- END supabase\migrations\20260317000001_education_date_precision.sql


-- BEGIN supabase\migrations\20260317000002_education_shs_tracks_strands.sql

-- Align Senior High track labels and TVL strands.
-- Additive / non-destructive for existing education rows.

update public.education_tracks
set name = 'Technical-Vocational-Livelihood (TVL) Track'
where slug = 'tvl';

update public.education_tracks
set name = 'Arts and Design Track'
where slug = 'arts-design';

update public.education_tracks
set name = 'Sports Track'
where slug = 'sports';

update public.education_tracks
set name = 'Academic Track'
where slug = 'academic';

update public.education_strands
set is_visible = false, name = 'TVL (legacy)'
where slug = 'tvl-strand';

update public.education_strands
set name = 'Other', is_visible = true
where slug = 'other-strand';

insert into public.education_strands (track_id, name, slug, display_order, is_visible)
select t.id, v.name, v.slug, v.display_order, true
from public.education_tracks t
cross join (values
  ('ICT', 'tvl-ict', 10),
  ('Home Economics', 'tvl-he', 20),
  ('Industrial Arts', 'tvl-ia', 30),
  ('Agri-Fishery Arts', 'tvl-afa', 40),
  ('Other', 'tvl-other', 999)
) as v(name, slug, display_order)
where t.slug = 'tvl'
on conflict (slug) do update
set name = excluded.name,
    track_id = excluded.track_id,
    display_order = excluded.display_order,
    is_visible = true;

insert into public.education_strands (track_id, name, slug, display_order, is_visible)
select t.id, 'Other', 'sports-other', 999, true
from public.education_tracks t
where t.slug = 'sports'
on conflict (slug) do update
set track_id = excluded.track_id, is_visible = true, name = 'Other';

insert into public.education_strands (track_id, name, slug, display_order, is_visible)
select t.id, 'Other', 'arts-design-other', 999, true
from public.education_tracks t
where t.slug = 'arts-design'
on conflict (slug) do update
set track_id = excluded.track_id, is_visible = true, name = 'Other';

insert into public.education_strands (track_id, name, slug, display_order, is_visible)
select t.id, 'Other', 'academic-other', 999, true
from public.education_tracks t
where t.slug = 'academic'
on conflict (slug) do update
set track_id = excluded.track_id, is_visible = true, name = 'Other';

-- END supabase\migrations\20260317000002_education_shs_tracks_strands.sql


-- BEGIN supabase\migrations\20260318000000_hero_config_realtime.sql

insert into public.section_content (section_key, content_key, content_value, content_type)
values
  ('hero', 'config_filename', 'developer.config.json', 'text'),
  ('hero', 'config_key_engineer', 'engineer', 'text'),
  ('hero', 'config_engineer', '', 'text'),
  ('hero', 'config_key_status', 'status', 'text'),
  ('hero', 'config_status', 'Open to Work', 'text'),
  ('hero', 'config_key_focus', 'focus', 'text'),
  ('hero', 'config_focus', '', 'text'),
  ('hero', 'config_key_ready', 'readyForDeployment', 'text'),
  ('hero', 'config_ready', 'true', 'boolean')
on conflict (section_key, content_key) do nothing;

do $$
declare
  tbl text;
  tables text[] := array[
    'awards',
    'award_categories',
    'training_records'
  ];
begin
  foreach tbl in array tables loop
    begin
      execute format(
        'alter publication supabase_realtime add table public.%I',
        tbl
      );
    exception
      when duplicate_object then
        null;
      when undefined_object then
        null;
    end;
  end loop;
end $$;

-- END supabase\migrations\20260318000000_hero_config_realtime.sql


-- BEGIN supabase\migrations\20260319000000_profile_personal_details.sql

alter table public.profiles
  add column if not exists birthdate date,
  add column if not exists gender text,
  add column if not exists religion text,
  add column if not exists birthplace text,
  add column if not exists nationality text,
  add column if not exists civil_status text;

-- END supabase\migrations\20260319000000_profile_personal_details.sql


-- BEGIN supabase\migrations\20260320000000_project_date_precision.sql

-- Allow project timeline dates to be year-only or month+year.
-- Stored dates remain PostgreSQL dates (first of month / Jan 1);
-- precision columns control display and admin round-trip.

alter table public.projects
  add column if not exists start_date_precision text not null default 'month',
  add column if not exists end_date_precision text not null default 'month';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_start_date_precision_check'
  ) then
    alter table public.projects
      add constraint projects_start_date_precision_check
      check (start_date_precision in ('year', 'month'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'projects_end_date_precision_check'
  ) then
    alter table public.projects
      add constraint projects_end_date_precision_check
      check (end_date_precision in ('year', 'month'));
  end if;
end $$;

-- END supabase\migrations\20260320000000_project_date_precision.sql


-- BEGIN supabase\migrations\20260321000000_project_docs_private_bucket.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-project-docs',
  'portfolio-project-docs',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can read project docs" on storage.objects;
create policy "Admins can read project docs"
on storage.objects
for select
to authenticated
using (bucket_id = 'portfolio-project-docs' and public.is_admin());

drop policy if exists "Admins can upload project docs" on storage.objects;
create policy "Admins can upload project docs"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'portfolio-project-docs' and public.is_admin());

drop policy if exists "Admins can update project docs" on storage.objects;
create policy "Admins can update project docs"
on storage.objects
for update
to authenticated
using (bucket_id = 'portfolio-project-docs' and public.is_admin())
with check (bucket_id = 'portfolio-project-docs' and public.is_admin());

drop policy if exists "Admins can delete project docs" on storage.objects;
create policy "Admins can delete project docs"
on storage.objects
for delete
to authenticated
using (bucket_id = 'portfolio-project-docs' and public.is_admin());

-- END supabase\migrations\20260321000000_project_docs_private_bucket.sql

-- BEGIN supabase\migrations\20260322000000_project_field_content_versions.sql
-- (see migration file for full DDL; already applied remotely)
-- END supabase\migrations\20260322000000_project_field_content_versions.sql
