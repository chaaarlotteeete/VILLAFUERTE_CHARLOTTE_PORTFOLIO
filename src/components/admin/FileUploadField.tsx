import { FileText, Loader2, RefreshCw, Upload, X } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { STORAGE_BUCKETS, type StorageBucket } from '@/lib/storage'
import { uploadPublicFile } from '@/services/storage'

interface FileUploadFieldProps {
  label: string
  value?: string | null
  folder: string
  bucket?: StorageBucket
  accept?: string
  onUploaded: (url: string) => void
  multiple?: boolean
  onUploadedMany?: (urls: string[]) => void
  maxSizeMB?: number
  onClear?: () => void
  helperText?: string
  allowReplace?: boolean
}

function defaultMaxSizeMB(accept: string) {
  const lower = accept.toLowerCase()
  if (lower.includes('pdf') || lower.includes('application/pdf')) return 10
  return 5
}

function formatAcceptHint(accept: string) {
  return accept
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')
}

function fileMatchesAccept(file: File, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  if (tokens.length === 0) return true

  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()

  return tokens.some((token) => {
    if (token.startsWith('.')) {
      return name.endsWith(token)
    }
    if (token.endsWith('/*')) {
      const prefix = token.slice(0, -1)
      return mime.startsWith(prefix)
    }
    return mime === token || name.endsWith(`.${token.replace(/^\./, '')}`)
  })
}

function isImageValue(url: string, accept: string) {
  if (accept.includes('image')) return true
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)
}

export function FileUploadField({
  label,
  value,
  folder,
  bucket = STORAGE_BUCKETS.media,
  accept = 'image/*',
  onUploaded,
  multiple = false,
  onUploadedMany,
  maxSizeMB,
  onClear,
  helperText,
  allowReplace = true,
}: FileUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [dragOver, setDragOver] = React.useState(false)
  const [lastFailedFiles, setLastFailedFiles] = React.useState<File[] | null>(
    null,
  )

  const limitMB = maxSizeMB ?? defaultMaxSizeMB(accept)
  const maxBytes = limitMB * 1024 * 1024
  const acceptHint = formatAcceptHint(accept)
  const showPreview = Boolean(value)
  const canUpload = allowReplace || !value

  function validateFiles(files: File[]): File[] {
    const valid: File[] = []
    for (const file of files) {
      if (!fileMatchesAccept(file, accept)) {
        toast.error(`"${file.name}" is not an allowed file type.`)
        continue
      }
      if (file.size > maxBytes) {
        toast.error(
          `"${file.name}" exceeds the ${limitMB} MB size limit.`,
        )
        continue
      }
      valid.push(file)
    }
    return valid
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return

    setUploading(true)
    setProgress(15)
    setLastFailedFiles(null)

    const timer = window.setInterval(() => {
      setProgress((v) => (v >= 90 ? v : v + 10))
    }, 180)

    try {
      const urls: string[] = []
      for (const file of files) {
        const url = await uploadPublicFile(bucket, folder, file)
        urls.push(url)
      }
      setProgress(100)

      if (multiple && onUploadedMany) {
        onUploadedMany(urls)
      } else if (urls[0]) {
        onUploaded(urls[0])
      }

      toast.success(
        files.length > 1 ? `${files.length} files uploaded` : 'File uploaded',
      )
    } catch (error) {
      setLastFailedFiles(files)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      window.clearInterval(timer)
      setUploading(false)
      setProgress(0)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || !canUpload) return
    const files = validateFiles(
      multiple ? Array.from(fileList) : [fileList[0]].filter(Boolean),
    )
    await uploadFiles(files)
  }

  function handleClear() {
    if (onClear) {
      onClear()
    } else {
      onUploaded('')
    }
    setLastFailedFiles(null)
  }

  function onBrowseClick() {
    inputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={uploading || !canUpload}
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {canUpload ? (
        <div
          role="button"
          tabIndex={uploading ? -1 : 0}
          aria-disabled={uploading}
          onKeyDown={(event) => {
            if (uploading) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onBrowseClick()
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault()
            if (!uploading) setDragOver(true)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            if (!uploading) setDragOver(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setDragOver(false)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            if (uploading) return
            void handleFiles(event.dataTransfer.files)
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
            'min-h-[120px] touch-manipulation',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 bg-muted/30',
            uploading && 'pointer-events-none opacity-70',
          )}
        >
          {uploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              Drag and drop files here, or choose files
            </p>
            {acceptHint ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Supported: {acceptHint}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              Max size: {limitMB} MB
              {multiple ? ' per file' : ''}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            className="min-h-10"
            onClick={onBrowseClick}
          >
            Browse Files
          </Button>
        </div>
      ) : null}

      {uploading ? (
        <div className="space-y-1" aria-live="polite">
          <p className="text-xs text-muted-foreground">
            Uploading... {progress}%
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {lastFailedFiles?.length ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => void uploadFiles(lastFailedFiles)}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <span className="text-xs text-muted-foreground">
            Last upload failed
          </span>
        </div>
      ) : null}

      {showPreview && value ? (
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-start justify-between gap-2">
            {isImageValue(value, accept) ? (
              <img
                src={value}
                alt={label}
                className="max-h-40 w-full max-w-full rounded-md border object-cover sm:max-w-xs"
              />
            ) : (
              <Button asChild variant="outline" size="sm">
                <a href={value} target="_blank" rel="noreferrer">
                  <FileText className="h-4 w-4" />
                  View current file
                </a>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Remove file"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="break-all text-xs text-muted-foreground">{value}</p>
        </div>
      ) : null}
    </div>
  )
}