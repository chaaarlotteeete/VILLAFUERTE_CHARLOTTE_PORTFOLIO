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
