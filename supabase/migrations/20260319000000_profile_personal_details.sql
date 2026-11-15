-- Personal identity fields for the portfolio profile.

alter table public.profiles
  add column if not exists birthdate date,
  add column if not exists gender text,
  add column if not exists religion text,
  add column if not exists birthplace text,
  add column if not exists nationality text,
  add column if not exists civil_status text;
