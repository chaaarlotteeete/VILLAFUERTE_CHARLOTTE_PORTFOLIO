-- Phase 3: Secure contact submission with basic rate limiting.
-- Frontend should still drop honeypot submissions client-side before calling this.

create or replace function public.submit_contact_message(
  p_full_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_honeypot text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_recent_count integer;
begin
  -- Bot trap: if honeypot is filled, pretend success without storing.
  if p_honeypot is not null and length(trim(p_honeypot)) > 0 then
    return gen_random_uuid();
  end if;

  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'Full name is required.';
  end if;

  if p_email is null or p_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'A valid email address is required.';
  end if;

  if p_subject is null or length(trim(p_subject)) < 2 then
    raise exception 'Subject is required.';
  end if;

  if p_message is null or length(trim(p_message)) < 10 then
    raise exception 'Message must be at least 10 characters.';
  end if;

  select count(*)
  into v_recent_count
  from public.contact_messages
  where lower(email) = lower(trim(p_email))
    and created_at > timezone('utc', now()) - interval '1 hour';

  if v_recent_count >= 3 then
    raise exception 'Too many messages submitted. Please try again later.';
  end if;

  insert into public.contact_messages (full_name, email, subject, message)
  values (
    trim(p_full_name),
    lower(trim(p_email)),
    trim(p_subject),
    trim(p_message)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;
