import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  EXTRACTION_TYPE_LABELS,
  IMPORTABLE_SCALAR_FIELDS,
  IMPORT_FIELD_LABELS,
  normalizeExtraction,
  type ExtractionType,
  type ImportableField,
  type ImportableScalarField,
  type ProjectDocumentExtraction,
  type ProjectDocumentImportResult,
} from '@/types/projectDocumentImport'
import { cn } from '@/lib/utils'

interface ProjectDocumentImportReviewProps {
  open: boolean
  result: ProjectDocumentImportResult | null
  occupiedFields: Set<ImportableField>
  onCancel: () => void
  onUploadAnother: () => void
  onApply: (
    result: ProjectDocumentImportResult,
    fields: Set<ImportableField>,
  ) => void
}

function confidenceBadge(confidence: string) {
  if (confidence === 'high') return 'success' as const
  if (confidence === 'low' || confidence === 'missing') return 'outline' as const
  return 'secondary' as const
}

function formatPages(pages: number[] | undefined) {
  if (!pages?.length) return null
  return `p. ${[...new Set(pages)].join(', ')}`
}

function extractionTypeLabel(type: ExtractionType | string | undefined) {
  if (type === 'rephrased' || type === 'summary' || type === 'extracted') {
    return EXTRACTION_TYPE_LABELS[type]
  }
  if (type === 'explicit') return EXTRACTION_TYPE_LABELS.extracted
  return EXTRACTION_TYPE_LABELS.extracted
}

function SourceExcerpt({ excerpt }: { excerpt?: string | null }) {
  if (!excerpt?.trim()) return null
  return (
    <details className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
      <summary className="cursor-pointer select-none font-medium text-muted-foreground">
        View original extracted text
      </summary>
      <p className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">
        {excerpt}
      </p>
    </details>
  )
}

function cloneExtraction(
  extraction: ProjectDocumentExtraction,
): ProjectDocumentExtraction {
  return normalizeExtraction(
    JSON.parse(JSON.stringify(extraction)) as ProjectDocumentExtraction,
  )
}

export function ProjectDocumentImportReview({
  open,
  result,
  occupiedFields,
  onCancel,
  onUploadAnother,
  onApply,
}: ProjectDocumentImportReviewProps) {
  const sourceExtraction = result?.extraction ?? null

  const draftResetKey = result
    ? `${result.fileName}|${result.fileSize}|${result.extraction.extraction_mode}|${result.extraction.page_count}`
    : ''

  const [draftState, setDraftState] = useState<{
    key: string
    draft: ProjectDocumentExtraction | null
    selectMode: boolean
    selected: Set<ImportableField>
    editing: ImportableScalarField | null
  }>({
    key: '',
    draft: null,
    selectMode: false,
    selected: new Set(),
    editing: null,
  })

  const availableFields = useMemo(() => {
    const extraction = draftState.draft
    if (!extraction) return [] as ImportableField[]
    const fields: ImportableField[] = []
    for (const field of IMPORTABLE_SCALAR_FIELDS) {
      if (extraction[field]) fields.push(field)
    }
    if (extraction.features.length) fields.push('features')
    if (extraction.contributions.length) fields.push('contributions')
    if (extraction.technologies.length) fields.push('technologies')
    return fields
  }, [draftState.draft])

  if (draftResetKey && draftState.key !== draftResetKey && sourceExtraction) {
    const draft = cloneExtraction(sourceExtraction)
    const fields: ImportableField[] = []
    for (const field of IMPORTABLE_SCALAR_FIELDS) {
      if (draft[field]) fields.push(field)
    }
    if (draft.features.length) fields.push('features')
    if (draft.contributions.length) fields.push('contributions')
    if (draft.technologies.length) fields.push('technologies')
    setDraftState({
      key: draftResetKey,
      draft,
      selectMode: false,
      selected: new Set(fields),
      editing: null,
    })
  }

  const extraction = draftState.draft
  const selected = draftState.selected
  const selectMode = draftState.selectMode

  function updateDraft(
    updater: (current: ProjectDocumentExtraction) => ProjectDocumentExtraction,
  ) {
    setDraftState((current) => {
      if (!current.draft) return current
      return { ...current, draft: updater(current.draft) }
    })
  }

  function setSelected(next: Set<ImportableField>) {
    setDraftState((current) => ({ ...current, selected: next }))
  }

  function setSelectMode(next: boolean) {
    setDraftState((current) => ({ ...current, selectMode: next }))
  }

  function setEditing(next: ImportableScalarField | null) {
    setDraftState((current) => ({ ...current, editing: next }))
  }

  function toggleField(field: ImportableField, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(field)
    else next.delete(field)
    setSelected(next)
  }

  function updateScalar(field: ImportableScalarField, value: string) {
    updateDraft((current) => {
      const next = { ...current, [field]: value || null } as ProjectDocumentExtraction
      if (field === 'title' && value && (!current.slug || current.slug === slugFrom(current.title))) {
        next.slug = slugFrom(value)
      }
      return next
    })
  }

  if (!extraction || !result) {
    return (
      <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Import review</DialogTitle>
          <p className="text-sm text-muted-foreground">
            No extraction result to review.
          </p>
        </DialogContent>
      </Dialog>
    )
  }

  const overwriteCount = [...selected].filter((field) =>
    occupiedFields.has(field),
  ).length

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col overflow-hidden p-0">
        <div className="space-y-4 p-6 pb-3">
          <DialogTitle className="pr-8">
            Review extracted project information
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4" />
            <span className="font-medium text-foreground">{result.fileName}</span>
            <Badge variant="secondary">
              {extraction.extraction_mode.toUpperCase()}
            </Badge>
            <Badge variant={confidenceBadge(extraction.overall_confidence)}>
              Confidence: {extraction.overall_confidence}
            </Badge>
            <span>{extraction.page_count} page(s) analyzed</span>
            {extraction.used_ocr_pages.length ? (
              <span>OCR: {formatPages(extraction.used_ocr_pages)}</span>
            ) : null}
          </div>

          {extraction.warnings.length ? (
            <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4" />
                Review notes
              </div>
              <ul className="list-disc space-y-1 pl-5">
                {extraction.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 text-sm">
            {extraction.missing_fields.length ? (
              <p className="text-muted-foreground">
                Missing: {extraction.missing_fields.join(', ')}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
                All core fields were found
              </p>
            )}
            {extraction.uncertain_fields.length ? (
              <p className="text-amber-700 dark:text-amber-300">
                Needs review: {extraction.uncertain_fields.join(', ')}
              </p>
            ) : null}
          </div>
        </div>

        <div className="max-h-[52vh] space-y-4 overflow-y-auto border-y px-6 py-3">
          {availableFields.map((field) => {
            const occupied = occupiedFields.has(field)
            const meta = extraction.field_meta[field]
            const checked = selected.has(field)
            const lowConfidence =
              meta?.confidence === 'low' ||
              extraction.uncertain_fields.includes(field)

            return (
              <div
                key={field}
                className={cn(
                  'rounded-lg border p-3',
                  occupied &&
                    'border-amber-300/70 bg-amber-50/40 dark:bg-amber-950/20',
                  lowConfidence && 'ring-1 ring-amber-400/50',
                )}
              >
                <div className="flex items-start gap-3">
                  {selectMode ? (
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleField(field, Boolean(value))
                      }
                      className="mt-1"
                      aria-label={`Import ${IMPORT_FIELD_LABELS[field]}`}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label className="text-sm font-medium">
                        {IMPORT_FIELD_LABELS[field]}
                      </Label>
                      <Badge
                        variant={confidenceBadge(
                          meta?.confidence ||
                            (field === 'features' ||
                            field === 'contributions' ||
                            field === 'technologies'
                              ? 'medium'
                              : 'missing'),
                        )}
                      >
                        {meta?.confidence || 'detected'}
                      </Badge>
                      <Badge variant="outline">
                        {extractionTypeLabel(meta?.extraction_type)}
                      </Badge>
                      {formatPages(meta?.source_pages) ? (
                        <span className="text-xs text-muted-foreground">
                          {formatPages(meta?.source_pages)}
                        </span>
                      ) : null}
                      {meta?.source_section ? (
                        <span className="text-xs text-muted-foreground">
                          § {meta.source_section}
                        </span>
                      ) : null}
                      {occupied ? (
                        <Badge variant="outline">Will overwrite</Badge>
                      ) : null}
                      {lowConfidence ? (
                        <Badge variant="outline">Manual review</Badge>
                      ) : null}
                      {IMPORTABLE_SCALAR_FIELDS.includes(
                        field as ImportableScalarField,
                      ) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-7 px-2"
                          onClick={() =>
                            setEditing(
                              draftState.editing === field
                                ? null
                                : (field as ImportableScalarField),
                            )
                          }
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                      ) : null}
                    </div>

                    {IMPORTABLE_SCALAR_FIELDS.includes(
                      field as ImportableScalarField,
                    ) ? (
                      draftState.editing === field ? (
                        field === 'full_description' ||
                        field === 'objectives' ||
                        field === 'short_description' ? (
                          <Textarea
                            value={String(extraction[field] ?? '')}
                            onChange={(event) =>
                              updateScalar(
                                field as ImportableScalarField,
                                event.target.value,
                              )
                            }
                            rows={4}
                          />
                        ) : (
                          <Input
                            value={String(extraction[field] ?? '')}
                            onChange={(event) =>
                              updateScalar(
                                field as ImportableScalarField,
                                event.target.value,
                              )
                            }
                          />
                        )
                      ) : (
                        <div className="space-y-2">
                          <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                            {String(extraction[field] ?? '—')}
                          </p>
                          <SourceExcerpt excerpt={meta?.source_excerpt} />
                        </div>
                      )
                    ) : null}

                    {field === 'features' ? (
                      <EditableList
                        items={extraction.features}
                        onChange={(features) =>
                          updateDraft((current) => ({ ...current, features }))
                        }
                      />
                    ) : null}
                    {field === 'contributions' ? (
                      <EditableList
                        items={extraction.contributions}
                        onChange={(contributions) =>
                          updateDraft((current) => ({
                            ...current,
                            contributions,
                          }))
                        }
                      />
                    ) : null}
                    {field === 'technologies' ? (
                      <div className="space-y-2">
                        {extraction.technologies.map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                          >
                            <div className="min-w-0 space-y-1">
                              <p className="font-medium">
                                {item.matched_name
                                  ? `${item.name} → ${item.matched_name}`
                                  : item.name}
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>{item.confidence}</span>
                                <span>
                                  {extractionTypeLabel(item.extraction_type)}
                                </span>
                                {formatPages(item.source_pages) ? (
                                  <span>{formatPages(item.source_pages)}</span>
                                ) : null}
                                {item.source_section ? (
                                  <span>§ {item.source_section}</span>
                                ) : null}
                              </div>
                              <SourceExcerpt excerpt={item.source_excerpt} />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove ${item.name}`}
                              onClick={() =>
                                updateDraft((current) => ({
                                  ...current,
                                  technologies: current.technologies.filter(
                                    (_, i) => i !== index,
                                  ),
                                }))
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}

          {!availableFields.length ? (
            <p className="text-sm text-muted-foreground">
              No project fields could be extracted from this document.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 p-6 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel Import
            </Button>
            <Button type="button" variant="outline" onClick={onUploadAnother}>
              Upload Another Document
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectMode ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelected(new Set(availableFields))}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={() =>
                    onApply(
                      { ...result, extraction },
                      selected,
                    )
                  }
                >
                  Import selected
                  {overwriteCount ? ` (${overwriteCount} overwrite)` : ''}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectMode(true)}
                >
                  Select Fields to Import
                </Button>
                <Button
                  type="button"
                  disabled={availableFields.length === 0}
                  onClick={() =>
                    onApply(
                      { ...result, extraction },
                      new Set(availableFields),
                    )
                  }
                >
                  Apply All Extracted Information
                  {occupiedFields.size
                    ? ` (${[...availableFields].filter((f) => occupiedFields.has(f)).length} overwrite)`
                    : ''}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function slugFrom(value: string | null | undefined) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function EditableList({
  items,
  onChange,
}: {
  items: ProjectDocumentExtraction['features']
  onChange: (items: ProjectDocumentExtraction['features']) => void
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={`${item.title}-${index}`}
          className="space-y-2 rounded-md border px-3 py-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Input
                value={item.title}
                onChange={(event) => {
                  const next = [...items]
                  next[index] = { ...item, title: event.target.value }
                  onChange(next)
                }}
                placeholder="Title"
              />
              <Textarea
                value={item.description}
                onChange={(event) => {
                  const next = [...items]
                  next[index] = { ...item, description: event.target.value }
                  onChange(next)
                }}
                rows={2}
                placeholder="Description"
              />
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant={confidenceBadge(item.confidence)}>
                  {item.confidence}
                </Badge>
                <span>{extractionTypeLabel(item.extraction_type)}</span>
                {formatPages(item.source_pages) ? (
                  <span>{formatPages(item.source_pages)}</span>
                ) : null}
                {item.source_section ? (
                  <span>§ {item.source_section}</span>
                ) : null}
              </div>
              <SourceExcerpt excerpt={item.source_excerpt} />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${item.title}`}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
