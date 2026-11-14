import { useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchVisibleHobbies, type PublicHobby } from '@/services/hobbies'

export function HobbiesPage() {
  const { data, error, loading, reload } = useAsyncData(fetchVisibleHobbies)
  const [active, setActive] = useState<PublicHobby | null>(null)

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const hobbies = data ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hobbies & Interests"
        description="Personal interests, creative pursuits, and life beyond code."
      />

      {hobbies.length === 0 ? (
        <EmptyState
          title="No hobbies published yet"
          description="Visible hobbies will appear here once added in the admin CMS."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hobbies.map((hobby) => (
            <button
              key={hobby.id}
              type="button"
              onClick={() => setActive(hobby)}
              className="overflow-hidden rounded-2xl border bg-card/80 text-left shadow-sm transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {hobby.cover_image_url ? (
                <img
                  src={hobby.cover_image_url}
                  alt={hobby.name}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-muted text-3xl">
                  {hobby.icon || '★'}
                </div>
              )}
              <div className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{hobby.name}</h2>
                  <Badge variant="outline">{hobby.category}</Badge>
                </div>
                {hobby.short_description ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {hobby.short_description}
                  </p>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>{active?.name}</DialogTitle>
          {active ? (
            <div className="space-y-4">
              {active.cover_image_url ? (
                <img
                  src={active.cover_image_url}
                  alt={active.name}
                  className="max-h-72 w-full rounded-lg border object-cover"
                />
              ) : null}
              <Badge variant="outline">{active.category}</Badge>
              {active.detailed_description || active.short_description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {active.detailed_description || active.short_description}
                </p>
              ) : null}
              {active.hobby_media.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {active.hobby_media.map((item) => (
                    <figure key={item.id} className="space-y-1">
                      <img
                        src={item.image_url}
                        alt={item.caption || active.name}
                        className="aspect-video w-full rounded-md border object-cover"
                      />
                      {item.caption ? (
                        <figcaption className="text-xs text-muted-foreground">
                          {item.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
