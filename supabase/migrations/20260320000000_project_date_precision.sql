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
