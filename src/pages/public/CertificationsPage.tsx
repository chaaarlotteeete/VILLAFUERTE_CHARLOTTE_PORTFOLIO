import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchCertifications } from '@/services/certifications'
import { formatDate } from '@/utils/date'

export function CertificationsPage() {
  const { data, error, loading, reload } = useAsyncData(fetchCertifications)
  const [category, setCategory] = useState('all')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const categories = useMemo(() => {
    const values = new Set(
      (data ?? [])
        .map((item) => item.category)
        .filter((value): value is string => Boolean(value)),
    )
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [data])

  const visible = (data ?? []).filter(
    (item) => category === 'all' || item.category === category,
  )

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Certifications & Achievements"
        description="Certificates and achievements managed through the admin dashboard."
      />

      {categories.length > 0 ? (
        <div className="max-w-xs">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState title="No certifications published yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              {item.image_url ? (
                <button
                  type="button"
                  className="block w-full overflow-hidden bg-muted"
                  onClick={() => setPreviewUrl(item.image_url)}
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="aspect-[16/10] w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ) : null}
              <div className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {item.category ? (
                    <Badge variant="secondary">{item.category}</Badge>
                  ) : null}
                  {item.issued_at ? (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.issued_at, 'MMM d, yyyy')}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.issuer}</p>
                {item.credential_url ? (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={item.credential_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View credential
                    </a>
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Certificate preview"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
          />
        </div>
      ) : null}
    </div>
  )
}
