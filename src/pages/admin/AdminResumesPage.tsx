import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { FileUploadField } from '@/components/admin/FileUploadField'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAsyncData } from '@/hooks/useAsyncData'
import { STORAGE_BUCKETS } from '@/lib/storage'
import {
  deleteResume,
  fetchAdminResumes,
  saveResume,
} from '@/services/adminContent'
import { formatDate } from '@/utils/date'

export function AdminResumesPage() {
  const { data, error, loading, reload } = useAsyncData(fetchAdminResumes)
  const [label, setLabel] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const items = data ?? []
  const published = useMemo(
    () => items.find((item) => item.is_published) ?? null,
    [items],
  )

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const activePreview = previewUrl || published?.file_url || null

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resume"
        description="Upload resume versions, preview PDFs, and publish the active download."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Current published resume</h2>
          {published ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{published.label}</p>
                <Badge variant="success">Published</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Uploaded {formatDate(published.uploaded_at, 'MMM d, yyyy HH:mm')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewUrl(published.file_url)}
                >
                  PDF preview
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <a href={published.file_url} target="_blank" rel="noreferrer">
                    Open file
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No published resume"
              description="Upload a version and publish it for public download."
            />
          )}

          <form
            className="space-y-4 border-t pt-4"
            onSubmit={(event) => {
              event.preventDefault()
              void (async () => {
                if (!fileUrl) {
                  toast.error('Upload a resume file first')
                  return
                }
                try {
                  await saveResume({
                    label: label.trim() || 'Resume',
                    file_url: fileUrl,
                    is_published: isPublished,
                  })
                  toast.success('Resume uploaded')
                  setLabel('')
                  setFileUrl('')
                  setIsPublished(false)
                  reload()
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Save failed')
                }
              })()
            }}
          >
            <h3 className="font-medium">Upload New Resume</h3>
            <div className="space-y-2">
              <Label htmlFor="resume-label">Version label</Label>
              <Input
                id="resume-label"
                placeholder="e.g. Resume 2026"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <FileUploadField
              label="Resume file (PDF)"
              folder="resumes"
              bucket={STORAGE_BUCKETS.resumes}
              accept=".pdf,application/pdf"
              value={fileUrl}
              onUploaded={(url) => {
                setFileUrl(url)
                setPreviewUrl(url)
              }}
            />
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              Publish after upload
            </label>
            <Button type="submit">Upload New Resume</Button>
          </form>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">PDF preview</h2>
          {activePreview ? (
            <iframe
              title="Resume PDF preview"
              src={activePreview}
              className="h-[32rem] w-full rounded-lg border bg-muted"
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Select or upload a PDF to preview
            </div>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Resume version list</h2>
        {items.length === 0 ? (
          <EmptyState title="No resume versions yet" />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.label}</h3>
                    {item.is_published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Archived version</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {formatDate(item.uploaded_at, 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewUrl(item.file_url)}
                  >
                    Preview
                  </Button>
                  {!item.is_published ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        void (async () => {
                          await saveResume({
                            id: item.id,
                            label: item.label,
                            file_url: item.file_url,
                            is_published: true,
                          })
                          toast.success('Resume published')
                          setPreviewUrl(item.file_url)
                          reload()
                        })()
                      }}
                    >
                      Publish selected version
                    </Button>
                  ) : null}
                  <ConfirmDeleteButton
                    title="Delete resume version?"
                    description="This permanently deletes the uploaded resume file record."
                    onConfirm={async () => {
                      await deleteResume(item.id)
                      if (previewUrl === item.file_url) setPreviewUrl(null)
                      toast.success('Deleted')
                      reload()
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
