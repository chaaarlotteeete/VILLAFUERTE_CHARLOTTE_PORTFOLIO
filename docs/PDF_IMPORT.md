# AI-Powered PDF Project Documentation Import

Admins can upload project documentation PDFs on **Create/Edit Project**. The secure backend extracts text, analyzes it, and opens a review screen before any form fields are applied. Projects are never auto-saved or published by import.

## Architecture

| Layer | Role |
|-------|------|
| Admin UI (`ProjectDocumentImport`) | Drag/drop PDF upload, progress, editable review, selective apply |
| Private Storage (`portfolio-project-docs`) | Admin-only PDF storage (not publicly readable) |
| Edge Function `extract-project-document` | Auth + full-document semantic AI analysis + evidence JSON |
| Optional Python worker (`services/pdf-import`) | PyMuPDF/pdfplumber/OCR alternative for self-hosting |

This is **targeted section extraction**, not full-document summarization:

1. Scan page text for relevant headings/keywords/synonyms (title, abstract, objectives, features, scope, tech, timeline, contributions, etc.).
2. Extract only matching section segments (skip references, literature reviews, appendices).
3. Send **only those segments** to the AI for field mapping.
4. OCR runs only on sparse pages that look project-relevant.

## Manual AI Writing Assistant

On Create/Edit Project, prose fields (role, descriptions, objectives, feature/contribution text) include AI actions: Rephrase, Summarize, Improve, Organize.

- Original input is preserved and never auto-overwritten
- Preview → Use This Version / Dismiss / Regenerate / Compare / History / Restore
- Versions persist in `project_field_content_versions` (original, AI-generated, manual edit, PDF import)
- Title, slug, dates, enums, and technology checkboxes do not show AI actions

PDF import suggestions and manual AI writing share the same preview/approval/version system.

The PDF import AI then **rephrases** targeted content into portfolio-ready wording (not raw paragraph paste):
- Short description = 1–2 sentence summary
- Full description = structured overview
- Objectives / features / contributions = concise professional rewrites
- Technologies / role = standardized extracted values

Each field is labeled as **Extracted**, **AI rephrased**, or **AI summary**, with an optional original excerpt for comparison in the review UI. Missing fields stay empty — nothing is fabricated or auto-saved.

API keys stay in Edge Function / worker secrets. They are never shipped in the Vite frontend.

## Setup (Supabase)

1. Apply migration `supabase/migrations/20260321000000_project_docs_private_bucket.sql` (already applied on the Portfolio project if using MCP).
2. Confirm Edge Function `extract-project-document` is deployed.
3. In Supabase Dashboard → **Edge Functions → Secrets**, set:

| Secret | Required | Notes |
|--------|----------|-------|
| `AI_API_KEY` | Required for AI Writing Assistant; recommended for PDF import | OpenAI-compatible key. Writing assist returns 503 without it. PDF import can still fall back to heuristics. |
| `AI_API_BASE_URL` | Optional | Default `https://api.openai.com/v1` (Gemini OpenAI-compatible endpoint also works) |
| `AI_MODEL` | Optional | Default `gpt-4o-mini`. For Gemini writing assist, prefer `gemini-3.5-flash-lite` (less overload than `gemini-3.8-flash`). |
| `AI_FALLBACK_MODEL` | Optional | Tried automatically on 404/503 (e.g. `gemini-3.6-flash`). |

```bash
npx supabase secrets set AI_API_KEY=sk-your-key --project-ref hzftyruxchzzpouibrlh
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to Edge Functions.

## Admin workflow

1. Open **Admin → Projects → Create/Edit**.
2. In **Basic Information**, use **Import from PDF Documentation**.
3. Upload a PDF (max 10 MB).
4. Wait for upload → text/OCR → secure analysis.
5. Review extracted fields, page references, missing/uncertain items.
6. Choose **Apply All** or **Select Fields to Import**.
7. Edit anything on the existing form.
8. Save as draft or publish manually.

Overwrite protection: fields that already contain values are marked **Will overwrite** in the review dialog.

## Optional Python worker

```bash
cd services/pdf-import
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
# optional OCR: install system Tesseract
set AI_API_KEY=...
set IMPORT_API_TOKEN=local-dev-token
uvicorn main:app --reload --port 8787
```

Health check: `GET http://127.0.0.1:8787/health`  
Extract: `POST /extract` multipart `file` + `technologies` JSON string.

## Security notes

- JWT + `is_admin()` required for the Edge Function.
- PDF contents are treated as untrusted data (prompt-injection resistant instructions).
- Import uploads go to a private bucket by default.
- Optional public documentation URL uses `portfolio-resumes` only when the admin opts in.
- File type and 10 MB size limits are enforced client-side and server-side.
