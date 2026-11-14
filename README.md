# Portfolio - Villafuerte Charlotte

Dynamic, database-driven personal IT project portfolio with a public website and private admin CMS.

## Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router
- Motion + Lucide React
- Supabase (PostgreSQL, Auth, Storage)
- GitHub Pages deployment target

## Phase status

- [x] Phase 1 — Planning and architecture
- [x] Phase 2 — Project setup
- [x] Phase 3 — Database migrations, RLS, Auth, Storage
- [x] Phase 4 — Public website data integration
- [x] Phase 5 — Admin dashboard CRUD
- [x] Phase 6 — Integration testing
- [x] Phase 7 — GitHub Pages + Actions

## Local setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Confirm `.env` contains your Supabase URL and publishable/anon key.

3. Install and run:

```bash
npm install
npm run dev
```

4. Open the local Vite URL shown in the terminal.

> Note: Vite `base` is set to `/VILLAFUERTE_CHARLOTTE_PORTFOLIO/` for GitHub Pages. For local browsing through that base path, use the URL Vite prints (it accounts for `base`). Override with `VITE_BASE_PATH=/` if you prefer root-path local development.

## Admin access

- Login route: `/admin/login`
- Intended admin email: `charlottevillafuerte.w@gmail.com`
- No public sign-up page
- Admin authorization will use the `admin_users` table (Phase 3)

## Important rules

- Do not hard-code portfolio content in React components
- Never expose Supabase service-role keys in the frontend
- Keep private messages and draft content behind RLS

## Supabase (Phase 3)

1. Create Auth user for `charlottevillafuerte.w@gmail.com` in the Supabase Dashboard.
2. Apply SQL from `supabase/APPLY_ALL.sql` in the SQL Editor (or run migrations via CLI).
3. Confirm details in [`supabase/README.md`](supabase/README.md).

## Admin CMS

After creating the Auth user and applying migrations:

1. Open `/admin/login`
2. Sign in with `charlottevillafuerte.w@gmail.com`
3. Manage profile, projects, skills, experience, education, certifications, resumes, messages, and settings

## Testing

```bash
npm run test:phase6
```

This runs lint, production build, and live Supabase smoke checks (anon key / RLS).  
See [`docs/PHASE6_TEST_RESULTS.md`](docs/PHASE6_TEST_RESULTS.md) for executed results and remaining manual browser checks.

## Deployment (GitHub Pages)

Automated deploy workflow: `.github/workflows/deploy-github-pages.yml`

1. Push this project to GitHub
2. Add Actions variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Settings → Pages → Source: **GitHub Actions**
4. Add your Pages URL to Supabase Auth redirect allow-list

Full guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
