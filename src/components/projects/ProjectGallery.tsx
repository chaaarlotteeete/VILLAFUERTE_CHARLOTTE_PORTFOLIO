import { useState } from 'react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { ProjectMedia } from '@/types/database'

interface ProjectGalleryProps {
  media: ProjectMedia[]
}

export function ProjectGallery({ media }: ProjectGalleryProps) {
  const [active, setActive] = useState<ProjectMedia | null>(null)

  if (media.length === 0) return null

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {media.map((item) => (
          <button
            key={item.id}
            type="button"
            className="group overflow-hidden rounded-xl border bg-card text-left shadow-sm"
            onClick={() => setActive(item)}
          >
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              <img
                src={item.image_url}
                alt={item.caption || 'Project screenshot'}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
            {item.caption ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {item.caption}
              </p>
            ) : null}
          </button>
        ))}
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">
            {active?.caption || 'Project screenshot'}
          </DialogTitle>
          {active ? (
            <img
              src={active.image_url}
              alt={active.caption || 'Project screenshot'}
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
