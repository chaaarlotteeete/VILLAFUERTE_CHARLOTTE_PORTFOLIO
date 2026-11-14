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
