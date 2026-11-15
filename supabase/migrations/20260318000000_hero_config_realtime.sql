-- Hero config card fields + ensure awards/training realtime publication.

insert into public.section_content (section_key, content_key, content_value, content_type)
values
  ('hero', 'config_filename', 'developer.config.json', 'text'),
  ('hero', 'config_key_engineer', 'engineer', 'text'),
  ('hero', 'config_engineer', '', 'text'),
  ('hero', 'config_key_status', 'status', 'text'),
  ('hero', 'config_status', 'Open to Work', 'text'),
  ('hero', 'config_key_focus', 'focus', 'text'),
  ('hero', 'config_focus', '', 'text'),
  ('hero', 'config_key_ready', 'readyForDeployment', 'text'),
  ('hero', 'config_ready', 'true', 'boolean')
on conflict (section_key, content_key) do nothing;

do $$
declare
  tbl text;
  tables text[] := array[
    'awards',
    'award_categories',
    'training_records'
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
