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
