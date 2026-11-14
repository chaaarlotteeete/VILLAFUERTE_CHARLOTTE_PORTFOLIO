-- Certifications visibility for admin CMS

alter table public.certifications
  add column if not exists is_visible boolean not null default true;

create index if not exists idx_certifications_visible_order
  on public.certifications (is_visible, display_order, issued_at desc);

drop policy if exists "Public can read certifications" on public.certifications;
create policy "Public can read certifications"
on public.certifications
for select
to anon, authenticated
using (is_visible = true or public.is_admin());
