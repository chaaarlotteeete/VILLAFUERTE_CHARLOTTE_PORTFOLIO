import { Copy, FileText, ImageIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAsyncData } from '@/hooks/useAsyncData'
import { STORAGE_BUCKETS } from '@/lib/storage'
import {
  deleteMediaLibraryItem,
  fetchMediaLibrary,
  uploadMediaLibraryFile,
  type MediaLibraryItem,
} from '@/services/adminMedia'
import { formatDate } from '@/utils/date'

function formatBytes(size: number | null) {
  if (!size) return '—'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function AdminMediaPage() {
  const { data, error, loading, reload } = useAsyncData(fetchMediaLibrary)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'document' | 'other'>(
    'all',
  )
  const [selected, setSelected] = useState<MediaLibraryItem | null>(null)
  const [uploading, setUploading] = useState(false)

  const items = useMemo(() => {
    let list = [...(data ?? [])]
    const query = search.trim().toLowerCase()
    if (query) {
      list = list.filter((item) =>
        [item.name, item.path, item.bucket].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
    }
    if (typeFilter !== 'all') {
      list = list.filter((item) => item.kind === typeFilter)
    }
    return list
  }, [data, search, typeFilter])

  async function handleUpload(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const isResume =
        file.type.includes('pdf') || /\.pdf$/i.test(file.name)
      const url = await uploadMediaLibraryFile(
        file,
        isResume ? 'resumes' : 'library',
        isResume ? STORAGE_BUCKETS.resumes : STORAGE_BUCKETS.media,
      )
      toast.success('File uploaded')
      reload()
      setSelected({
        id: url,
        name: file.name,
        path: url,
        bucket: isResume ? STORAGE_BUCKETS.resumes : STORAGE_BUCKETS.media,
        publicUrl: url,
        updatedAt: new Date().toISOString(),
        size: file.size,
        mimeType: file.type,
        kind: isResume ? 'document' : file.type.startsWith('image/') ? 'image' : 'other',
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('File URL copied')
    } catch {
      toast.error('Could not copy URL')
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Browse, upload, preview, and manage portfolio media assets."
      />

      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search media files"
        />
        <Select
          value={typeFilter}
          onValueChange={(value) =>
            setTypeFilter(value as 'all' | 'image' | 'document' | 'other')
          }
        >
          <SelectTrigger className="min-w-[10rem]">
            <SelectValue placeholder="File type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <div>
          <Label htmlFor="media-upload" className="sr-only">
            File upload
          </Label>
          <Input
            id="media-upload"
            type="file"
            disabled={uploading}
            onChange={(event) =>
              void handleUpload(event.target.files?.[0] ?? null)
            }
          />
          {uploading ? (
            <p className="mt-1 text-xs text-muted-foreground">Uploading...</p>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No media files found"
          description="Upload images or documents to populate the library."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.kind === 'image' ? (
                <img
                  src={item.publicUrl}
                  alt={item.name}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted">
                  {item.kind === 'document' ? (
                    <FileText className="size-8 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="size-8 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="space-y-1 p-3">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{item.kind}</Badge>
                  <Badge variant="secondary">{item.bucket}</Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>File details</DialogTitle>
          {selected ? (
            <div className="space-y-4">
              {selected.kind === 'image' ? (
                <img
                  src={selected.publicUrl}
                  alt={selected.name}
                  className="max-h-72 w-full rounded-lg border object-contain"
                />
              ) : selected.kind === 'document' &&
                selected.name.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  title={selected.name}
                  src={selected.publicUrl}
                  className="h-72 w-full rounded-lg border"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
                  Preview unavailable for this file type
                </div>
              )}
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="break-all font-medium">{selected.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>{selected.mimeType || selected.kind}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Size</dt>
                  <dd>{formatBytes(selected.size)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd>
                    {selected.updatedAt
                      ? formatDate(selected.updatedAt, 'MMM d, yyyy HH:mm')
                      : '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">URL</dt>
                  <dd className="break-all text-xs">{selected.publicUrl}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void copyUrl(selected.publicUrl)}
                >
                  <Copy />
                  Copy file URL
                </Button>
                <Button asChild variant="secondary">
                  <a href={selected.publicUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </Button>
                <ConfirmDeleteButton
                  title="Delete file?"
                  description="This permanently deletes the file from storage."
                  onConfirm={async () => {
                    await deleteMediaLibraryItem(selected)
                    toast.success('File deleted')
                    setSelected(null)
                    reload()
                  }}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
