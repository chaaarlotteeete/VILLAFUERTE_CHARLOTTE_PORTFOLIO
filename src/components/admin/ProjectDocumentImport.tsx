import {
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { ProjectDocumentImportReview } from '@/components/admin/ProjectDocumentImportReview'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  formatFileSize,
  importProjectDocumentFromPdf,
  type ImportProgress,
} from '@/services/projectDocumentExtract'
import type {
  ImportableField,
  ProjectDocumentImportResult,
} from '@/types/projectDocumentImport'
import { cn } from '@/lib/utils'

interface ProjectDocumentImportProps {
  technologyNames: string[]
  occupiedFields: Set<ImportableField>
  onApply: (
    result: ProjectDocumentImportResult,
    fields: Set<ImportableField>,
  ) => void
}

type UiStatus = 'idle' | 'processing' | 'review' | 'error'

export function ProjectDocumentImport({
  technologyNames,
  occupiedFields,
  onApply,
}: ProjectDocumentImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState<UiStatus>('idle')
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ProjectDocumentImportResult | null>(null)
  const [attachPublicDocs, setAttachPublicDocs] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  function resetInput() {
    if (inputRef.current) inputRef.current.value = ''
  }

  function clearFile() {
    setFile(null)
    setResult(null)
    setError(null)
    setProgress(null)
    setStatus('idle')
    setReviewOpen(false)
    resetInput()
  }

  async function processFile(nextFile: File | undefined) {
    if (!nextFile) return
    setFile(nextFile)
    setError(null)
    setResult(null)
    setStatus('processing')
    setProgress({
      stage: 'validating',
      progress: 0,
      message: 'Starting…',
    })

    try {
      const imported = await importProjectDocumentFromPdf({
        file: nextFile,
        technologyNames,
        attachAsPublicDocsUrl: attachPublicDocs,
        onProgress: setProgress,
      })
      setResult(imported)
      setStatus('review')
      setReviewOpen(true)
      toast.success('Document analyzed', {
        description: 'Review the extracted fields before applying them.',
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Document import failed'
      setError(message)
      setStatus('error')
      toast.error(message)
    } finally {
      resetInput()
    }
  }

  function onBrowse() {
    inputRef.current?.click()
  }

  return (
    <section className="space-y-4 rounded-xl border border-dashed bg-card/60 p-5">
      <div className="space-y-1">
        <Label className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          Import from PDF Documentation
        </Label>
        <p className="text-sm text-muted-foreground">
          Upload project documentation. The secure backend extracts text,
          analyzes it, and prepares form fields for your review. Nothing is
          saved until you apply and then save the project.
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          checked={attachPublicDocs}
          onCheckedChange={(value) => setAttachPublicDocs(Boolean(value))}
          disabled={status === 'processing'}
        />
        <span className="text-muted-foreground">
          Also attach a public copy to Documentation URL (optional). Import PDFs
          are stored privately by default.
        </span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        disabled={status === 'processing'}
        onChange={(event) => void processFile(event.target.files?.[0])}
      />

      {!file || status === 'idle' || status === 'error' ? (
        <div
          role="button"
          tabIndex={status === 'processing' ? -1 : 0}
          onKeyDown={(event) => {
            if (status === 'processing') return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onBrowse()
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setDragOver(false)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            void processFile(event.dataTransfer.files?.[0])
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 bg-muted/30',
          )}
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Drag and drop a PDF here, or choose a file
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF only · Max 10 MB
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onBrowse}>
            Choose PDF
          </Button>
        </div>
      ) : null}

      {file ? (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-background p-3">
          <div className="min-w-0 space-y-1">
            <p className="flex items-center gap-2 truncate text-sm font-medium">
              <FileText className="size-4 shrink-0" />
              <span className="truncate">{file.name}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
              {progress ? ` · ${progress.message}` : null}
            </p>
            {status === 'processing' && progress ? (
              <div className="space-y-1 pt-1" aria-live="polite">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {progress.progress}% · {progress.stage.replaceAll('_', ' ')}
                </p>
              </div>
            ) : null}
            {status === 'error' && error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            {status === 'review' ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Ready for review. Apply selected fields when you are satisfied.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {status === 'review' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewOpen(true)}
              >
                Open review
              </Button>
            ) : null}
            {status !== 'processing' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onBrowse}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove file"
                  onClick={clearFile}
                >
                  <X className="size-4" />
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" size="sm" disabled>
                <Loader2 className="animate-spin" />
                Processing…
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <ProjectDocumentImportReview
        open={reviewOpen && Boolean(result)}
        result={result}
        occupiedFields={occupiedFields}
        onCancel={() => setReviewOpen(false)}
        onUploadAnother={() => {
          clearFile()
          onBrowse()
        }}
        onApply={(editedResult, fields) => {
          onApply(editedResult, fields)
          setResult(editedResult)
          setReviewOpen(false)
          toast.success('Extracted fields applied to the form', {
            description: 'Review the form, then save as draft or publish.',
          })
        }}
      />
    </section>
  )
}
