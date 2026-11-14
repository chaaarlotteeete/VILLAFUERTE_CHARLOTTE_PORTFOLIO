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
