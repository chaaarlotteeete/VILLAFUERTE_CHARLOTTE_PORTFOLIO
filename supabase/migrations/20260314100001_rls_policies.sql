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
