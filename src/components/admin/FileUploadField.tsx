import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { STORAGE_BUCKETS, type StorageBucket } from '@/lib/storage'
import { uploadPublicFile } from '@/services/storage'

interface FileUploadFieldProps {
  label: string
  value?: string | null
  folder: string
  bucket?: StorageBucket
  accept?: string
  onUploaded: (url: string) => void
}

export function FileUploadField({
  label,
  value,
  folder,
  bucket = STORAGE_BUCKETS.media,
  accept = 'image/*',
  onUploaded,
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  async function handleChange(file: File | null) {
    if (!file) return
    setUploading(true)
    setProgress(15)
    const timer = window.setInterval(() => {
      setProgress((value) => (value >= 90 ? value : value + 10))
    }, 180)
    try {
      const url = await uploadPublicFile(bucket, folder, file)
      setProgress(100)
      onUploaded(url)
      toast.success('File uploaded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      window.clearInterval(timer)
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="file"
        accept={accept}
        disabled={uploading}
        onChange={(event) => void handleChange(event.target.files?.[0] ?? null)}
      />
      {uploading ? (
        <div className="space-y-1" aria-live="polite">
          <p className="text-xs text-muted-foreground">Uploading... {progress}%</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}
      {value ? (
        <div className="space-y-2">
          {accept.includes('image') ? (
            <img
              src={value}
              alt={label}
              className="max-h-40 rounded-md border object-cover"
            />
          ) : (
            <Button asChild variant="outline" size="sm">
              <a href={value} target="_blank" rel="noreferrer">
                View current file
              </a>
            </Button>
          )}
          <p className="break-all text-xs text-muted-foreground">{value}</p>
        </div>
      ) : null}
    </div>
  )
}
