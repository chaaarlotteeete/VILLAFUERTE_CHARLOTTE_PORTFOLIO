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
