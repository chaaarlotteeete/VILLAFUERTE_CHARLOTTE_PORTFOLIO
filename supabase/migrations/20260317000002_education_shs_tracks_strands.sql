-- Align Senior High track labels and TVL strands.
-- Additive / non-destructive for existing education rows.

update public.education_tracks
set name = 'Technical-Vocational-Livelihood (TVL) Track'
where slug = 'tvl';

update public.education_tracks
set name = 'Arts and Design Track'
where slug = 'arts-design';

update public.education_tracks
set name = 'Sports Track'
where slug = 'sports';

update public.education_tracks
set name = 'Academic Track'
where slug = 'academic';

update public.education_strands
set is_visible = false, name = 'TVL (legacy)'
where slug = 'tvl-strand';

update public.education_strands
set name = 'Other', is_visible = true
where slug = 'other-strand';

insert into public.education_strands (track_id, name, slug, display_order, is_visible)
select t.id, v.name, v.slug, v.display_order, true
from public.education_tracks t
cross join (values
  ('ICT', 'tvl-ict', 10),
  ('Home Economics', 'tvl-he', 20),
  ('Industrial Arts', 'tvl-ia', 30),
  ('Agri-Fishery Arts', 'tvl-afa', 40),
  ('Other', 'tvl-other', 999)
) as v(name, slug, display_order)
where t.slug = 'tvl'
on conflict (slug) do update
set name = excluded.name,
    track_id = excluded.track_id,
    display_order = excluded.display_order,
    is_visible = true;

insert into public.education_strands (track_id, name, slug, display_order, is_visible)
select t.id, 'Other', 'sports-other', 999, true
from public.education_tracks t
where t.slug = 'sports'
on conflict (slug) do update
set track_id = excluded.track_id, is_visible = true, name = 'Other';

insert into public.education_strands (track_id, name, slug, display_order, is_visible)
select t.id, 'Other', 'arts-design-other', 999, true
from public.education_tracks t
where t.slug = 'arts-design'
on conflict (slug) do update
set track_id = excluded.track_id, is_visible = true, name = 'Other';

insert into public.education_strands (track_id, name, slug, display_order, is_visible)
select t.id, 'Other', 'academic-other', 999, true
from public.education_tracks t
where t.slug = 'academic'
on conflict (slug) do update
set track_id = excluded.track_id, is_visible = true, name = 'Other';
