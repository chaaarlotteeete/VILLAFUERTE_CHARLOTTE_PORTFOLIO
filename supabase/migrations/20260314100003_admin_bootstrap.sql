-- Phase 3: Link the first administrator after the Auth user exists.
-- Safe to re-run: inserts only when the auth user is present and not already linked.

insert into public.admin_users (id, email, is_active)
select u.id, u.email, true
from auth.users u
where lower(u.email) = lower('charlottevillafuerte.w@gmail.com')
on conflict (id) do update
set
  email = excluded.email,
  is_active = true;
