# Phase 7 — GitHub Pages Deployment

Frontend hosts on **GitHub Pages**.  
Database, Auth, and Storage stay on **Supabase**.

## 1. Create the GitHub repository

Suggested repo name (matches default Vite base):

`VILLAFUERTE_CHARLOTTE_PORTFOLIO`

If you use a different name, either:

- set Actions variable `VITE_BASE_PATH` to `/YourRepoName/`, or
- rely on the workflow default: `/${{ github.event.repository.name }}/`

```bash
git init
git add .
git commit -m "Initial portfolio application"
git branch -M main
git remote add origin https://github.com/<your-username>/VILLAFUERTE_CHARLOTTE_PORTFOLIO.git
git push -u origin main
```

## 2. Configure GitHub Actions variables

Repo → **Settings → Secrets and variables → Actions → Variables**

| Name | Value | Notes |
|------|--------|------|
| `VITE_SUPABASE_URL` | `https://hzftyruxchzzpouibrlh.supabase.co` | Public |
| `VITE_SUPABASE_ANON_KEY` | your publishable/anon key | Public frontend key only |
| `VITE_BASE_PATH` | `/VILLAFUERTE_CHARLOTTE_PORTFOLIO/` | Optional if repo name matches |
| `VITE_SITE_TITLE` | `Portfolio - Villafuerte Charlotte` | Optional |
| `VITE_ADMIN_EMAIL` | `charlottevillafuerte.w@gmail.com` | Optional |

Never add the Supabase **service-role** key to GitHub Actions or the frontend.

## 3. Enable GitHub Pages

Repo → **Settings → Pages**

1. Source: **GitHub Actions**
2. Keep the `Deploy to GitHub Pages` workflow enabled
3. After the first successful run, site URL will look like:

`https://<your-username>.github.io/VILLAFUERTE_CHARLOTTE_PORTFOLIO/`

## 4. Configure Supabase Auth redirect URLs

Supabase Dashboard → **Authentication → URL Configuration**

Add:

- Site URL: `https://<your-username>.github.io/VILLAFUERTE_CHARLOTTE_PORTFOLIO`
- Redirect URLs:
  - `https://<your-username>.github.io/VILLAFUERTE_CHARLOTTE_PORTFOLIO/admin/login`
  - `http://localhost:5173/VILLAFUERTE_CHARLOTTE_PORTFOLIO/admin/login` (local)

## 5. Deploy

Push to `main`/`master`, or run **Actions → Deploy to GitHub Pages → Run workflow**.

The workflow:

1. Installs dependencies
2. Builds with Vite using public env vars
3. Prepares `.nojekyll` + SPA `404.html`
4. Deploys the `dist/` artifact to GitHub Pages

## 5b. Apply CMS database migrations

After pulling CMS updates, run new SQL in the Supabase SQL Editor (additive; does not delete portfolio rows):

1. `supabase/migrations/20260316000000_cms_architecture.sql` — page sections, navigation, skill categories
2. `supabase/migrations/20260317000000_education_training_hobbies_awards.sql` — education catalogs, training, awards, hobby options, certification TESDA fields
3. `supabase/migrations/20260317000001_education_date_precision.sql` — education year-only date precision
4. `supabase/migrations/20260317000002_education_shs_tracks_strands.sql` — SHS track/strand catalog cleanup
5. Or re-run the matching blocks at the end of `supabase/APPLY_ALL.sql`

Confirm tables/columns exist as needed: `education_levels`, `degree_options`, `training_records`, `awards`, `hobby_categories`, `hobby_options`, and new columns on `education` / `certifications` / `hobbies`.

Content edits in Admin (Education, Training, Awards, Hobbies, Certifications, Website Content) publish to Supabase and appear on the public site **without** a GitHub Pages redeploy.

## 6. Post-deploy verification checklist

- [ ] Homepage loads at the Pages URL
- [ ] Direct refresh on `/projects/<slug>` works (SPA fallback)
- [ ] Images/assets load (no broken `/assets/...` root paths)
- [ ] Public pages fetch Supabase content
- [ ] `/admin/login` opens and can authenticate
- [ ] Password reset redirect returns to admin login on Pages

## Local production preview

```bash
npm run build
npm run preview
```

Open the printed local preview URL (includes the configured base path).
