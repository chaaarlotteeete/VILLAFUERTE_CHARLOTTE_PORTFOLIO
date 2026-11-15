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
