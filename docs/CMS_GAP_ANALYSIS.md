# Public Content-to-Database Mapping & CMS Gap Analysis

**Date:** 2026-03-14  
**Scope:** Fully dynamic, admin-controlled portfolio CMS  
**Rule:** Preserve existing UI/UX; replace hard-coded copy with published Supabase content.

---

## Executive summary

| Area | Status |
|------|--------|
| Entity data (projects, skills, experience, education, hobbies, certs, resume, social) | Mostly dynamic with admin CRUD |
| Section chrome (eyebrows, headings, subtitles, hero headline, CTAs, footer, floating actions, nav labels) | Almost entirely hard-coded |
| Homepage visibility toggles | Partial (`site_settings.homepage`) — About/Experience/Contact not controlled; `section_order` unused |
| Branding / SEO in `site_settings` | Editable in admin, **not consumed** on public site |
| Draft / publish for section copy | Missing (only projects + resumes) |
| CMS tables (`page_sections`, `section_content`, `specialization_cards`, `navigation_items`, `content_revisions`, `skill_categories`) | **Missing** |

**Verdict:** The portfolio is entity-dynamic but layout-copy-static. Completing the CMS requires new relational tables for section copy, navigation, specialization cards, skill categories, and a draft/publish revision layer — then wiring every public component and building the missing admin editors.

---

## Legend

| Dynamic? | Meaning |
|----------|---------|
| **Yes** | Live from Supabase; admin can change without redeploy |
| **Partial** | DB/env with hard-coded fallbacks or incomplete admin UI |
| **No** | Fixed in React / constants |
| **Computed** | Derived (counts, filters, icon maps) — must stay calculated |

---

## 1. Full field mapping

### 1.1 Header — `PublicHeader.tsx` → Admin `/admin/appearance/header`

| Public field | Current source | Target table.column | Admin screen | Dynamic now? | Required change |
|--------------|----------------|---------------------|--------------|--------------|-----------------|
| Logo | — (uses avatar) | `site_settings.branding.logo_url` or `page_sections`/`section_content` header | Appearance → Header | No | Wire logo; fall back to profile image |
| Short display name | `profiles.full_name` → shortName() | `section_content` `header.display_name` **or** derived from profile | Header | Partial | Editable override + profile fallback |
| Professional subtitle | `profiles.title` / `specialization` | `section_content` `header.subtitle` | Header | Partial | Editable override |
| Profile thumbnail | `profiles.profile_image_url` | `profiles.profile_image_url` | Profile / Header | Partial | Already DB; ensure Header editor can set |
| Nav labels / order / visibility | `PUBLIC_SECTION_NAV` hard-coded | `navigation_items` | Header | No | New table + dynamic nav |
| Resume button label | Hard-coded `"Resume"` | `section_content` `header.resume_label` + `resumes.label` | Header | No | Editable label |
| Resume button visibility | Always shown if URL | `section_content` `header.show_resume` | Header | Partial | Toggle |
| Theme toggle visibility | Always on | `section_content` `header.show_theme_toggle` | Header | No | Toggle |
| Mobile nav config | Same hard-coded list | `navigation_items` (`location=mobile` or inherit header) | Header | No | Config + preview |

### 1.2 Hero — `HeroSection.tsx` → `/admin/content/hero`

| Public field | Current source | Target | Admin | Dynamic? | Change |
|--------------|----------------|--------|-------|----------|--------|
| Eyebrow / availability badge | Hard-coded | `section_content` hero keys | Hero | No | Editable + show/hide |
| Main headline | Hard-coded H1 | `section_content` `hero.headline` (+ optional HTML/parts) | Hero | No | Editable |
| Full name | `profiles.full_name` | `profiles.full_name` | Profile / Hero | Yes | Ensure Hero editor links profile |
| Professional title | `profiles.title` | `profiles.title` | Profile / Hero | Yes | — |
| Short introduction | `profiles.short_intro` | `profiles.short_intro` | Profile / Hero | Yes | — |
| Career objective | `profiles.career_objective` | `profiles.career_objective` | Profile | Yes | Surface in Hero editor |
| Specialization | `profiles.specialization` (no admin input) | `profiles.specialization` | Profile / Hero | Partial | Add form fields |
| Technical interests | `profiles.technical_interests` (no admin input) | `profiles.technical_interests` | Profile / Hero | Partial | Add form fields |
| Profile image | `profiles.profile_image_url` | same | Profile | Yes | — |
| Availability status / badge text | Hard-coded | `section_content` | Hero | No | Editable |
| Primary / secondary CTA label + destination | Hard-coded | `section_content` | Hero | No | Editable + URL/hash validation |
| GitHub / LinkedIn visibility | Always if links exist | `section_content` + `social_links.is_visible` | Hero | Partial | Toggles |
| Background / visual config | Hard-coded blurs | `section_content` / `site_settings` | Hero | No | Optional JSON config |
| Published project count | Computed from projects | **Computed only** | — | Computed | Do not allow manual edit |

### 1.3 About — `AboutSection.tsx` → `/admin/content/about`

| Public field | Current source | Target | Admin | Dynamic? | Change |
|--------------|----------------|--------|-------|----------|--------|
| Eyebrow / heading / subtitle | Hard-coded | `page_sections` (`about`) | About | No | CMS |
| Professional biography | `profiles.bio` | `profiles.bio` | About / Profile | Yes | — |
| Career objective | `profiles.career_objective` | same | About | Yes | — |
| About card heading / description | Hard-coded | `section_content` | About | No | CMS |
| Profile Vitals heading / visibility | Hard-coded | `section_content` | About | No | CMS |
| Degree / graduation | `education[0]` | `education` (reference, not duplicate) | Education | Partial | Keep as FK/reference |
| Location | `profiles.location` | `profiles.location` | Profile | Yes | — |
| Core focus | `profiles.specialization` | same | Profile | Partial | Admin field |
| Work model | Hard-coded | `section_content` `about.work_model` | About | No | Editable |
| Specialization cards (3 fixed) | `FOCUS_CARDS` constant | `specialization_cards` + skill links | About | No | CRUD, reorder, unlimited |

### 1.4 Skills — `SkillsSection.tsx` → `/admin/skills`

| Public field | Current source | Target | Admin | Dynamic? | Change |
|--------------|----------------|--------|-------|----------|--------|
| Eyebrow / heading / description | Hard-coded | `page_sections` (`skills`) | Skills | No | CMS |
| Skill categories / filters | `SKILL_FILTERS` + free-text `skills.category` | `skill_categories` | Skills | Partial | Category table; filters from DB |
| Skill name / icon / visibility / order | `skills.*` | `skills` + category FK | Skills | Yes | Link to categories; fix RLS for `is_visible` |
| Section visibility | `homepage.show_highlighted_skills` | `page_sections.is_visible` | Homepage settings | Yes | Unify with `page_sections` |

### 1.5 Featured / All Projects → `/admin/projects`

| Public field | Current source | Target | Admin | Dynamic? | Change |
|--------------|----------------|--------|-------|----------|--------|
| Section eyebrow / heading / subtitle | Hard-coded | `page_sections` (`featured_projects`, `projects`) | Projects / Content | No | CMS |
| Featured limit | `homepage.featured_limit` | `page_sections` or homepage settings | Projects | Yes | Keep |
| Featured filter | `is_published AND is_featured` | `projects` | Projects | Yes | Do **not** duplicate table |
| Project fields, media, tech, publish | `projects` + children | same | Projects form | Yes | Preserve |
| Archive filters | `PROJECT_TYPES` constants | Derived from published data (+ optional labels) | — | Partial | Generate from DB |
| Detail page by slug | Dynamic | `projects.slug` | Projects | Yes | Draft preview = admin only |

### 1.6 Experience & Education → `/admin/experience`, `/admin/education`

| Public field | Current source | Target | Admin | Dynamic? | Change |
|--------------|----------------|--------|-------|----------|--------|
| Section eyebrow / heading / description | Hard-coded | `page_sections` (`experience`) | Content | No | CMS |
| Column headings | Hard-coded | `section_content` | Content | No | CMS |
| Experience / education rows | Tables | same + `is_visible` | Experience / Education | Partial | Add visibility |
| Achievements / highlights | DB | same | Existing forms | Yes | — |

### 1.7 Hobbies → `/admin/hobbies`

| Public field | Current source | Target | Admin | Dynamic? | Change |
|--------------|----------------|--------|-------|----------|--------|
| Section chrome | Hard-coded | `page_sections` (`hobbies`) | Hobbies | No | CMS |
| Hobby records + gallery | `hobbies`, `hobby_media` | same | Hobbies | Yes | Preserve |
| Empty section behavior | Hidden if empty | `page_sections` + optional empty-state flag | Homepage / Hobbies | Partial | Config empty state |

### 1.8 Certifications → `/admin/certifications`

| Public field | Current source | Target | Admin | Dynamic? | Change |
|--------------|----------------|--------|-------|----------|--------|
| Section chrome | Hard-coded | `page_sections` (`certifications`) | Certifications | No | CMS |
| Certificate rows | `certifications` + `is_visible` | same | Certifications | Yes | Preserve |

### 1.9 Contact → `/admin/content/contact`

| Public field | Current source | Target | Admin | Dynamic? | Change |
|--------------|----------------|--------|-------|----------|--------|
| Eyebrow / heading / description / form heading | Hard-coded | `page_sections` + `section_content` | Contact | No | CMS |
| Contact email / location / social | settings + profile + social | same | Contact | Partial | Centralize |
| Form enable, success message | `site_settings.contact` | same + expand keys | Contact | Partial | Add submit label, error msg, opportunity options |
| Opportunity type options | Hard-coded `<option>`s | `section_content` / contact JSON | Contact | No | Editable list |
| Submissions | `contact_messages` via RPC | same | Messages | Yes | Keep validation/security |

### 1.10 Footer — `PublicFooter.tsx` → `/admin/appearance/footer`

| Public field | Current source | Target | Admin | Dynamic? | Change |
|--------------|----------------|--------|-------|----------|--------|
| Display name / intro / badge / description | Profile + hard-coded | `section_content` + profile | Footer | Partial | CMS |
| Nav links | Hard-coded 5 links | `navigation_items` (`footer`) | Footer | No | Dynamic |
| Social / email / admin link visibility | Mixed | settings + social | Footer | Partial | Toggles |
| Copyright | Hard-coded year `2026` | Auto year + optional custom | Footer | Partial | Auto year |
| System status | Hard-coded “Operational” | Real health check / omit fake status | Footer | No | Reflect real app health |

### 1.11 Floating actions → `/admin/appearance/floating-actions`

| Public field | Current source | Target | Admin | Dynamic? | Change |
|--------------|----------------|--------|-------|----------|--------|
| Contact CTA label / visibility / destination | Hard-coded “Hire Charlotte” | `site_settings.floating_actions` | Floating Actions | No | CMS |
| Back to top visibility / position | Always on | same | Floating Actions | No | CMS |
| Realtime indicator | Shows when subscribed | same + real connection state only | Floating Actions | Partial | Toggle; never fake “connected” |

### 1.12 Branding / SEO / document head

| Public field | Current source | Target | Admin | Dynamic? | Change |
|--------------|----------------|--------|-------|----------|--------|
| `<title>`, favicon, OG | `index.html` / env | `site_settings.branding` + `seo` | Settings | Partial | Wire into runtime `<Helmet>` / effect |

### 1.13 Homepage section visibility → `/admin/settings/homepage`

| Section | Spec control | Current | Target |
|---------|--------------|---------|--------|
| Home | Always on | Always | `page_sections` locked |
| About | Show/Hide | Always | `page_sections.is_visible` |
| Skills | Show/Hide | `show_highlighted_skills` | Unify |
| Featured Projects | Show/Hide | `show_featured_projects` | Unify |
| All Projects | Always on | Always | Locked |
| Experience & Education | Show/Hide | Always | New flag |
| Hobbies | Show/Hide | `show_hobbies` | Unify |
| Certifications | Show/Hide | `show_certifications` | Unify |
| Contact | Always on | Always | Locked |

Hidden sections: remove from page + nav; keep DB rows.

---

## 2. Existing vs required schema

| Table | Exists? | Notes |
|-------|---------|-------|
| `profiles`, `projects`, children, `technologies`, `skills`, `experiences`, `education`, `hobbies`, `hobby_media`, `certifications`, `resumes`, `social_links`, `contact_messages` | Yes | Reuse |
| `site_settings` | Yes | Expand keys; keep JSON for global config |
| `page_sections` | **No** | Add |
| `section_content` | **No** | Add (key/value + draft/published) |
| `specialization_cards` (+ skill links) | **No** | Add |
| `navigation_items` | **No** | Add |
| `content_revisions` | **No** | Add for draft preview / publish / rollback |
| `skill_categories` | **No** | Add; migrate distinct `skills.category` values |

### Draft / publish design (chosen)

1. **Published** rows in `page_sections` / `section_content` / related CMS tables are public-readable via RLS.  
2. **Drafts** live in `content_revisions` (JSON snapshot per entity) and never pass public RLS.  
3. **Preview** uses admin session + draft payload overlaid on public layout (`?preview=1` or `/admin/preview`).  
4. **Publish** copies draft → published tables in a transaction; optional revision retained for rollback.  
5. Projects/resumes keep existing `is_published` flags (no duplicate featured table).

### RLS gaps to fix

- `skills.is_visible`: enforce in RLS (currently UI-only).  
- Add `is_visible` on `experiences` / `education` with RLS.  
- Public SELECT only for `publication_state = 'published'` (or equivalent) on CMS tables.  
- Never expose service role in frontend.

---

## 3. Admin navigation gap

| Required nav item | Current |
|-------------------|---------|
| Dashboard | Yes |
| Website Content | **Missing** → `/admin/content` |
| Projects | Yes |
| Skills & Technologies | Yes (extend categories) |
| Experience / Education / Hobbies / Certifications / Resume / Media / Messages / Profile | Yes |
| Appearance | **Missing** → header / footer / floating |
| Site Settings | Yes (split Homepage settings) |

---

## 4. Public data-flow gaps

| Requirement | Current | Change |
|-------------|---------|--------|
| Load published settings + sections | Partial portfolio fetch | Extend `fetchPortfolioData` |
| Nav from visible sections | Hard-coded | Build from `navigation_items` ∩ visible sections |
| Calculated project stats | Yes | Keep computed |
| Content updates without redeploy | Entity yes; copy no | After CMS wiring, yes |
| Realtime | Present for entities + `site_settings` | Add new CMS tables to publication; keep optional |

---

## 5. Implementation phases (approved plan)

1. **Database & CMS architecture** — migrations, seeds from current hard-coded copy, RLS  
2. **Centralized Website Content Editor** — section cards, draft/publish UX  
3. **Public website integration** — replace hard-coded chrome; visibility + nav sync  
4. **Admin modules** — header/footer/floating/hero/about/contact/categories  
5. **Realtime & performance** — subscriptions, refetch fallbacks  
6. **Testing** — draft vs published, RLS, responsive admin, no-redeploy updates  

---

## 6. Non-goals / constraints

- Do not redesign public UI.  
- Do not delete existing projects/media.  
- Do not hard-code admin-editable text as source of truth (fallbacks OK only until seed loads).  
- Do not show fake stats or fake realtime “connected”.  
- Do not claim tests passed without running them.
