# Supabase setup (Phase 3)

Project URL: `https://hzftyruxchzzpouibrlh.supabase.co`  
Admin email: `charlottevillafuerte.w@gmail.com`

## 1. Create the Auth user (Dashboard)

1. Open **Authentication → Users → Add user**
2. Email: `charlottevillafuerte.w@gmail.com`
3. Set a strong password
4. Confirm/auto-confirm the user
5. Keep **public sign-up disabled** (Auth settings → disable new user sign-ups if available)

There is no public registration page in the app.

## 2. Apply migrations

### Option A — Supabase SQL Editor (recommended for first setup)

1. Open **SQL Editor**
2. Run these files in order (copy/paste contents):
   1. `migrations/20260314100000_init_schema.sql`
   2. `migrations/20260314100001_rls_policies.sql`
   3. `migrations/20260314100002_storage.sql`
   4. `migrations/20260314100003_admin_bootstrap.sql`
   5. `migrations/20260314100004_contact_submit_rpc.sql`

Or run the combined script:

- `APPLY_ALL.sql`

### Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref hzftyruxchzzpouibrlh
npx supabase db push
```

## 3. Verify

In SQL Editor:

```sql
select * from public.admin_users;
select * from public.profiles;
select id, name, public from storage.buckets;
select public.is_admin(); -- false when not logged in as admin
```

Expected:

- One profile shell for Charlotte Villafuerte
- `admin_users` row linked to your Auth user
- Buckets: `portfolio-media`, `portfolio-resumes`

## 4. Security checklist

- Frontend uses only the publishable/anon key
- Service-role key stays in Supabase Dashboard / CI secrets only (never in Vite)
- Draft projects are hidden by RLS until `is_published = true`
- Contact messages are insertable publicly, readable only by admins
- Contact RPC rate-limits to 3 messages / email / hour and ignores filled honeypot values

## Storage buckets

| Bucket | Public read | Write | Use |
|--------|-------------|-------|-----|
| `portfolio-media` | Yes | Admin only | Profile image, screenshots, cert images |
| `portfolio-resumes` | Yes | Admin only | Resume PDFs/DOCX |

## Next

After migrations are applied, continue to **Phase 4** to connect public pages to live Supabase data.
