import type {
  ProjectPlatform,
  ProjectStatus,
  ProjectType,
} from '@/types/database'

export type ExtractionConfidence = 'high' | 'medium' | 'low' | 'missing'

/**
 * - extracted: directly supported / near-verbatim from documentation
 * - rephrased: portfolio-ready wording preserving original meaning
 * - summary: condensed overview grounded in documented content
 */
export type ExtractionType = 'extracted' | 'rephrased' | 'summary'

export interface ExtractedListItem {
  title: string
  description: string
  source_pages: number[]
  source_section: string | null
  /** Original excerpt from the PDF that supports this item. */
  source_excerpt: string | null
  confidence: ExtractionConfidence
  extraction_type: ExtractionType
  /** @deprecated Prefer extraction_type */
  is_inferred: boolean
}

export interface ExtractedTechnology {
  name: string
  matched_name: string | null
  source_pages: number[]
  source_section: string | null
  source_excerpt: string | null
  confidence: ExtractionConfidence
  extraction_type: ExtractionType
}

export interface FieldMeta {
  confidence: ExtractionConfidence
  source_pages: number[]
  source_section: string | null
  /** Original excerpt from the PDF used to produce the field value. */
  source_excerpt: string | null
  extraction_type: ExtractionType
  /** @deprecated Prefer extraction_type */
  is_inferred: boolean
}

export interface ProjectDocumentExtraction {
  title: string | null
  slug: string | null
  role: string | null
  short_description: string | null
  full_description: string | null
  objectives: string | null
  project_type: ProjectType | null
  platform: ProjectPlatform | null
  status: ProjectStatus | null
  start_date: string | null
  end_date: string | null
  github_url: string | null
  live_url: string | null
  features: ExtractedListItem[]
  contributions: ExtractedListItem[]
  technologies: ExtractedTechnology[]
  field_meta: Record<string, FieldMeta>
  missing_fields: string[]
  uncertain_fields: string[]
  overall_confidence: 'high' | 'medium' | 'low'
  extraction_mode: 'ai' | 'heuristic' | 'hybrid'
  warnings: string[]
  page_count: number
  used_ocr_pages: number[]
}

export type ImportableScalarField =
  | 'title'
  | 'slug'
  | 'role'
  | 'short_description'
  | 'full_description'
  | 'objectives'
  | 'project_type'
  | 'platform'
  | 'status'
  | 'start_date'
  | 'end_date'
  | 'github_url'
  | 'live_url'

export type ImportableField =
  | ImportableScalarField
  | 'features'
  | 'contributions'
  | 'technologies'

export const IMPORTABLE_SCALAR_FIELDS: ImportableScalarField[] = [
  'title',
  'slug',
  'role',
  'short_description',
  'full_description',
  'objectives',
  'project_type',
  'platform',
  'status',
  'start_date',
  'end_date',
  'github_url',
  'live_url',
]

export const IMPORT_FIELD_LABELS: Record<ImportableField, string> = {
  title: 'Project Title',
  slug: 'Slug',
  role: 'Role',
  short_description: 'Short Description',
  full_description: 'Full Description',
  objectives: 'Objectives',
  project_type: 'Project Type',
  platform: 'Platform',
  status: 'Project Status',
  start_date: 'Start Date',
  end_date: 'End Date',
  github_url: 'GitHub URL',
  live_url: 'Live URL',
  features: 'Features',
  contributions: 'Individual Contributions',
  technologies: 'Technologies',
}

export const EXTRACTION_TYPE_LABELS: Record<ExtractionType, string> = {
  extracted: 'Extracted',
  rephrased: 'AI rephrased',
  summary: 'AI summary',
}

export interface ProjectDocumentImportResult {
  extraction: ProjectDocumentExtraction
  storagePath: string | null
  publicDocsUrl: string | null
  fileName: string
  fileSize: number
}

function normalizeExtractionType(raw: unknown, isInferred?: boolean): ExtractionType {
  if (raw === 'rephrased' || raw === 'summary' || raw === 'extracted') return raw
  if (raw === 'explicit') return 'extracted'
  if (isInferred || raw === 'inferred') return 'summary'
  return 'extracted'
}

export function normalizeExtraction(
  raw: ProjectDocumentExtraction,
): ProjectDocumentExtraction {
  const normalizeList = (items: ExtractedListItem[] = []) =>
    items.map((item) => {
      const extraction_type = normalizeExtractionType(
        item.extraction_type,
        item.is_inferred,
      )
      return {
        ...item,
        source_section: item.source_section ?? null,
        source_excerpt: item.source_excerpt ?? null,
        extraction_type,
        is_inferred: extraction_type !== 'extracted',
        source_pages: item.source_pages ?? [],
        confidence: item.confidence || 'medium',
      }
    })

  const technologies = (raw.technologies || []).map((item) => {
    const extraction_type = normalizeExtractionType(item.extraction_type)
    return {
      ...item,
      matched_name: item.matched_name ?? null,
      source_section: item.source_section ?? null,
      source_excerpt: item.source_excerpt ?? null,
      extraction_type,
      source_pages: item.source_pages ?? [],
      confidence: item.confidence || 'medium',
    }
  })

  const field_meta: Record<string, FieldMeta> = {}
  for (const [key, meta] of Object.entries(raw.field_meta || {})) {
    const extraction_type = normalizeExtractionType(
      meta.extraction_type,
      meta.is_inferred,
    )
    field_meta[key] = {
      confidence: meta.confidence || 'medium',
      source_pages: meta.source_pages || [],
      source_section: meta.source_section ?? null,
      source_excerpt: meta.source_excerpt ?? null,
      extraction_type,
      is_inferred: extraction_type !== 'extracted',
    }
  }

  return {
    ...raw,
    features: normalizeList(raw.features),
    contributions: normalizeList(raw.contributions),
    technologies,
    field_meta,
    missing_fields: raw.missing_fields || [],
    uncertain_fields: raw.uncertain_fields || [],
    warnings: raw.warnings || [],
    used_ocr_pages: raw.used_ocr_pages || [],
  }
}
