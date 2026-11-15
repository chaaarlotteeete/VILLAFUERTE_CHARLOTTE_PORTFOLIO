-- Private bucket for AI PDF project documentation imports (admin-only access)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-project-docs',
  'portfolio-project-docs',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can read project docs" on storage.objects;
create policy "Admins can read project docs"
on storage.objects
for select
to authenticated
using (bucket_id = 'portfolio-project-docs' and public.is_admin());

drop policy if exists "Admins can upload project docs" on storage.objects;
create policy "Admins can upload project docs"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'portfolio-project-docs' and public.is_admin());

drop policy if exists "Admins can update project docs" on storage.objects;
create policy "Admins can update project docs"
on storage.objects
for update
to authenticated
using (bucket_id = 'portfolio-project-docs' and public.is_admin())
with check (bucket_id = 'portfolio-project-docs' and public.is_admin());

drop policy if exists "Admins can delete project docs" on storage.objects;
create policy "Admins can delete project docs"
on storage.objects
for delete
to authenticated
using (bucket_id = 'portfolio-project-docs' and public.is_admin());
