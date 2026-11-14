-- Phase 3: Storage buckets and policies
-- portfolio-media: public read, admin write (images, screenshots, certs, profile)
-- portfolio-resumes: public read for files under published use; admin write

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'portfolio-media',
    'portfolio-media',
    true,
    10485760,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml'
    ]
  ),
  (
    'portfolio-resumes',
    'portfolio-resumes',
    true,
    10485760,
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read
drop policy if exists "Public can read portfolio media" on storage.objects;
create policy "Public can read portfolio media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-media');

drop policy if exists "Public can read portfolio resumes" on storage.objects;
create policy "Public can read portfolio resumes"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-resumes');

-- Admin write/update/delete
drop policy if exists "Admins can upload portfolio media" on storage.objects;
create policy "Admins can upload portfolio media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('portfolio-media', 'portfolio-resumes')
  and public.is_admin()
);

drop policy if exists "Admins can update portfolio media" on storage.objects;
create policy "Admins can update portfolio media"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('portfolio-media', 'portfolio-resumes')
  and public.is_admin()
)
with check (
  bucket_id in ('portfolio-media', 'portfolio-resumes')
  and public.is_admin()
);

drop policy if exists "Admins can delete portfolio media" on storage.objects;
create policy "Admins can delete portfolio media"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('portfolio-media', 'portfolio-resumes')
  and public.is_admin()
);
