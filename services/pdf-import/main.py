"""
Optional Python PDF import worker (PyMuPDF + pdfplumber + OCR).

The production admin UI calls the Supabase Edge Function
`extract-project-document`. This service mirrors the same extraction contract
for local/self-hosted use when you prefer PyMuPDF.

Environment:
  AI_API_KEY       OpenAI-compatible API key (optional; heuristic fallback)
  AI_API_BASE_URL  default https://api.openai.com/v1
  AI_MODEL         default gpt-4o-mini
  IMPORT_API_TOKEN shared secret required in Authorization: Bearer <token>
"""

from __future__ import annotations

import io
import json
import os
import re
from typing import Any, Literal

import fitz  # PyMuPDF
import httpx
import pdfplumber
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

MAX_BYTES = 10 * 1024 * 1024
MAX_CHARS = 120_000
CHUNK_SIZE = 12_000
MIN_TEXT_CHARS = 40

PROJECT_TYPES = ("Individual", "Group", "Capstone", "Academic")
PROJECT_PLATFORMS = ("Web", "Mobile", "Web and Mobile")
PROJECT_STATUSES = ("Ongoing", "Completed", "Archived")

app = FastAPI(title="Project PDF Import", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS", "GET"],
    allow_headers=["*"],
)
security = HTTPBearer(auto_error=False)


class PageText(BaseModel):
    page: int
    text: str


class ExtractionResult(BaseModel):
    title: str | None = None
    slug: str | None = None
    role: str | None = None
    short_description: str | None = None
    full_description: str | None = None
    objectives: str | None = None
    project_type: str | None = None
    platform: str | None = None
    status: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    github_url: str | None = None
    live_url: str | None = None
    features: list[dict[str, Any]] = Field(default_factory=list)
    contributions: list[dict[str, Any]] = Field(default_factory=list)
    technologies: list[dict[str, Any]] = Field(default_factory=list)
    field_meta: dict[str, Any] = Field(default_factory=dict)
    missing_fields: list[str] = Field(default_factory=list)
    uncertain_fields: list[str] = Field(default_factory=list)
    overall_confidence: Literal["high", "medium", "low"] = "low"
    extraction_mode: Literal["ai", "heuristic", "hybrid"] = "heuristic"
    warnings: list[str] = Field(default_factory=list)
    page_count: int = 0
    used_ocr_pages: list[int] = Field(default_factory=list)


def require_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> None:
    expected = os.getenv("IMPORT_API_TOKEN", "").strip()
    if not expected:
        return
    if not credentials or credentials.credentials != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


def sanitize_text(raw: str) -> str:
    cleaned = raw.replace("\x00", " ")
    cleaned = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f]", " ", cleaned)
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"\s+", "-", value)
    value = re.sub(r"-+", "-", value)
    return value.strip("-")


def extract_with_pymupdf(data: bytes) -> list[PageText]:
    pages: list[PageText] = []
    doc = fitz.open(stream=data, filetype="pdf")
    try:
        if doc.is_encrypted:
            raise HTTPException(
                status_code=400,
                detail="This PDF appears encrypted or password-protected.",
            )
        for index, page in enumerate(doc, start=1):
            text = sanitize_text(page.get_text("text"))
            if text:
                pages.append(PageText(page=index, text=text))
    finally:
        doc.close()
    return pages


def extract_with_pdfplumber(data: bytes) -> list[PageText]:
    pages: list[PageText] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for index, page in enumerate(pdf.pages, start=1):
            text = sanitize_text(page.extract_text() or "")
            if text:
                pages.append(PageText(page=index, text=text))
    return pages


def ocr_sparse_pages(data: bytes, existing: list[PageText]) -> tuple[list[PageText], list[int]]:
    """OCR pages that lack enough text. Requires system tesseract if available."""
    try:
        import pytesseract
        from PIL import Image
    except Exception:
        return existing, []

    by_page = {page.page: page.text for page in existing}
    used_ocr: list[int] = []
    doc = fitz.open(stream=data, filetype="pdf")
    try:
        for index, page in enumerate(doc, start=1):
            current = by_page.get(index, "")
            if len(current) >= MIN_TEXT_CHARS:
                continue
            if len(used_ocr) >= 5:
                break
            pix = page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6))
            image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            text = sanitize_text(pytesseract.image_to_string(image))
            if text:
                by_page[index] = text
                used_ocr.append(index)
    finally:
        doc.close()

    pages = [PageText(page=page, text=text) for page, text in sorted(by_page.items())]
    return pages, used_ocr


def extract_labeled_block(text: str, labels: list[str]) -> str | None:
    label_pattern = "|".join(re.escape(label) for label in labels)
    regex = re.compile(
        rf"(?:^|\n)\s*(?:{label_pattern})\s*[:\-–]?\s*([^\n]+(?:\n(?!\s*(?:{label_pattern})\s*[:\-–]).*)*)",
        re.IGNORECASE,
    )
    match = regex.search(text)
    if not match:
        return None
    return match.group(1).strip()


def heuristic_extract(pages: list[PageText], known: list[str]) -> ExtractionResult:
    joined = "\n\n".join(page.text for page in pages)
    warnings: list[str] = []
    title = extract_labeled_block(
        joined,
        ["Project Title", "Title", "Project Name", "System Title", "Capstone Title"],
    )
    if title:
        title = title.split("\n", 1)[0].strip()[:160]
    role = extract_labeled_block(joined, ["Role", "Position", "Your Role", "Project Role"])
    if role:
        role = role.split("\n", 1)[0].strip()[:120]
    short_description = extract_labeled_block(
        joined,
        ["Short Description", "Summary", "Overview", "Abstract", "Project Summary"],
    )
    if short_description:
        short_description = short_description[:400]
    full_description = extract_labeled_block(
        joined,
        [
            "Full Description",
            "Description",
            "Project Description",
            "About the Project",
            "Introduction",
        ],
    ) or short_description
    objectives = extract_labeled_block(
        joined, ["Objectives", "Goals", "Project Objectives", "Aim"]
    )

    def parse_enum(raw: str | None, options: tuple[str, ...]) -> str | None:
        if not raw:
            return None
        normalized = raw.strip().lower()
        for option in options:
            if option.lower() == normalized:
                return option
        return None

    project_type = parse_enum(
        extract_labeled_block(joined, ["Project Type", "Type", "Category"]),
        PROJECT_TYPES,
    )
    platform = parse_enum(
        extract_labeled_block(joined, ["Platform", "Target Platform"]),
        PROJECT_PLATFORMS,
    )
    status = parse_enum(
        extract_labeled_block(joined, ["Status", "Project Status"]),
        PROJECT_STATUSES,
    )

    features_raw = extract_labeled_block(
        joined, ["Features", "Key Features", "System Features", "Functionalities"]
    )
    contributions_raw = extract_labeled_block(
        joined,
        [
            "Contributions",
            "Contribution",
            "My Contributions",
            "Individual Contributions",
            "Personal Contributions",
        ],
    )
    tech_raw = extract_labeled_block(
        joined,
        [
            "Technologies",
            "Tech Stack",
            "Tools",
            "Stack",
            "Technologies Used",
            "Programming Languages",
        ],
    )

    def parse_list(raw: str | None) -> list[dict[str, Any]]:
        if not raw:
            return []
        items = []
        for line in re.split(r"\n|•|●|▪|■|;", raw):
            cleaned = re.sub(r"^[\s\-*–—\d.)]+", "", line).strip()
            if len(cleaned) <= 1:
                continue
            parts = re.split(r"\s*[:\-–]\s*", cleaned, maxsplit=1)
            items.append(
                {
                    "title": parts[0].strip(),
                    "description": parts[1].strip() if len(parts) > 1 else "",
                    "source_pages": [],
                    "confidence": "medium",
                    "is_inferred": False,
                }
            )
        return items

    technologies = []
    if tech_raw:
        for token in re.split(r",|\||/|\n|•|;", tech_raw):
            name = re.sub(r"^[\s\-*–—]+", "", token).strip()
            if len(name) <= 1 or len(name) >= 40:
                continue
            matched = next((k for k in known if k.lower() == name.lower()), None)
            technologies.append(
                {
                    "name": name,
                    "matched_name": matched,
                    "source_pages": [],
                    "confidence": "high" if matched else "medium",
                }
            )

    scalar = {
        "title": title,
        "role": role,
        "short_description": short_description,
        "full_description": full_description,
        "objectives": objectives,
        "project_type": project_type,
        "platform": platform,
        "status": status,
        "start_date": None,
        "end_date": None,
        "github_url": None,
        "live_url": None,
    }
    features = parse_list(features_raw)
    contributions = parse_list(contributions_raw)
    if not contributions and extract_labeled_block(
        joined, ["Responsibilities", "Tasks", "Team Responsibilities"]
    ):
        warnings.append(
            "Found team/group responsibilities but not explicit individual contributions."
        )

    missing = [
        key
        for key in [
            "title",
            "role",
            "short_description",
            "full_description",
            "objectives",
            "project_type",
            "platform",
            "status",
            "start_date",
            "end_date",
            "features",
            "contributions",
            "technologies",
        ]
        if (
            (key == "features" and not features)
            or (key == "contributions" and not contributions)
            or (key == "technologies" and not technologies)
            or (key not in {"features", "contributions", "technologies"} and not scalar.get(key))
        )
    ]
    filled = 13 - len(missing)
    confidence: Literal["high", "medium", "low"] = (
        "high" if filled >= 9 else "medium" if filled >= 5 else "low"
    )

    return ExtractionResult(
        title=title,
        slug=slugify(title) if title else None,
        role=role,
        short_description=short_description,
        full_description=full_description,
        objectives=objectives,
        project_type=project_type,
        platform=platform,
        status=status,
        features=features,
        contributions=contributions,
        technologies=technologies,
        field_meta={
            key: {
                "confidence": "medium" if value else "missing",
                "source_pages": [],
                "is_inferred": False,
            }
            for key, value in scalar.items()
        },
        missing_fields=missing,
        overall_confidence=confidence,
        extraction_mode="heuristic",
        warnings=warnings,
        page_count=len(pages),
    )


async def extract_with_ai(pages: list[PageText], known: list[str]) -> ExtractionResult:
    api_key = os.getenv("AI_API_KEY", "").strip()
    if not api_key:
        result = heuristic_extract(pages, known)
        result.warnings.append(
            "AI_API_KEY is not configured. Used rule-based extraction instead."
        )
        return result

    base_url = os.getenv("AI_API_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("AI_MODEL", "gpt-4o-mini")
    joined = ""
    for page in pages:
        joined += f"\n\n--- PAGE {page.page} ---\n{page.text}"
    joined = joined[:MAX_CHARS]

    system_prompt = (
        "You receive TARGETED project documentation segments only "
        "(not a full manuscript). Map them into portfolio fields. "
        "Do not summarize unrelated chapters. Do not fabricate. "
        "Use null/[] when unknown. Do not assume end dates. "
        "Separate individual contributions from group tasks. Return ONLY JSON."
    )
    schema = {
        "title": None,
        "slug": None,
        "role": None,
        "short_description": None,
        "full_description": None,
        "objectives": None,
        "project_type": None,
        "platform": None,
        "status": None,
        "start_date": None,
        "end_date": None,
        "github_url": None,
        "live_url": None,
        "features": [],
        "contributions": [],
        "technologies": [],
    }

    try:
        async with httpx.AsyncClient(timeout=55.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": model,
                    "temperature": 0,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user",
                            "content": (
                                f"Known technologies: {', '.join(known) or '(none)'}\n"
                                f"Schema: {json.dumps(schema)}\n"
                                f"Document:\n{joined[:CHUNK_SIZE * 4]}"
                            ),
                        },
                    ],
                },
            )
        if response.status_code >= 400:
            raise RuntimeError(response.text[:300])
        content = response.json()["choices"][0]["message"]["content"]
        payload = json.loads(content)
        base = heuristic_extract(pages, known)
        for key in schema:
            if payload.get(key) not in (None, "", []):
                setattr(base, key, payload[key])
        if base.title and not base.slug:
            base.slug = slugify(base.title)
        base.extraction_mode = "ai"
        return base
    except Exception as exc:  # noqa: BLE001
        result = heuristic_extract(pages, known)
        result.extraction_mode = "hybrid"
        result.warnings.append(f"AI extraction failed ({exc}). Used heuristic fallback.")
        return result


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/extract")
async def extract(
    _: None = Depends(require_token),
    file: UploadFile = File(...),
    technologies: str = Form("[]"),
) -> dict[str, Any]:
    if file.content_type and file.content_type not in {
        "application/pdf",
        "application/octet-stream",
    }:
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="PDF exceeds the 10 MB limit.")

    try:
        known = json.loads(technologies) if technologies else []
        if not isinstance(known, list):
            known = []
        known = [str(item).strip() for item in known if str(item).strip()]
    except json.JSONDecodeError:
        known = []

    warnings: list[str] = []
    try:
        pages = extract_with_pymupdf(data)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"PyMuPDF failed ({exc}); trying pdfplumber.")
        try:
            pages = extract_with_pdfplumber(data)
        except Exception as plumber_exc:  # noqa: BLE001
            raise HTTPException(
                status_code=400,
                detail=f"Could not read this PDF: {plumber_exc}",
            ) from plumber_exc

    pages, used_ocr = ocr_sparse_pages(data, pages)
    if not pages:
        raise HTTPException(
            status_code=422,
            detail="No readable text found. The PDF may be scanned or corrupted.",
        )

    result = await extract_with_ai(pages, known)
    result.warnings = [*warnings, *result.warnings]
    result.used_ocr_pages = used_ocr
    result.page_count = max(result.page_count, len(pages))
    return {"ok": True, "extraction": result.model_dump()}
