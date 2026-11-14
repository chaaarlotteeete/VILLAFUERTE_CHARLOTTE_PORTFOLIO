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
