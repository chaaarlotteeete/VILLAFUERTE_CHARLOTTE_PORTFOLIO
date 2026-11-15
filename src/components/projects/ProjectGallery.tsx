import { useMemo, useState } from 'react'

import { MaterialIcon } from '@/components/public/MaterialIcon'
import { cn } from '@/lib/utils'
import type { ProjectMedia } from '@/types/database'

interface ProjectGalleryProps {
  media: ProjectMedia[]
  projectTitle?: string
}

export function ProjectGallery({ media, projectTitle }: ProjectGalleryProps) {
  const [index, setIndex] = useState(0)

  const slides = useMemo(
    () =>
      media.map((item, i) => ({
        id: item.id,
        imageUrl: item.image_url,
        title: item.caption?.trim() || `Screen ${i + 1}`,
        subtitle: item.caption?.trim()
          ? `Visual ${String(i + 1).padStart(2, '0')}`
          : projectTitle
            ? `${projectTitle} interface`
            : 'Project interface',
        tag: `Screen ${i + 1} of ${media.length}`,
      })),
    [media, projectTitle],
  )

  if (slides.length === 0) return null

  const active = slides[index] ?? slides[0]

  function goTo(next: number) {
    setIndex((next + slides.length) % slides.length)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <span className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
            Visual System Evidence
          </span>
          <h2 className="font-display text-3xl font-semibold text-on-surface lg:text-4xl">
            Interactive Interface Gallery
          </h2>
        </div>
        {slides.length > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => goTo(index - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface shadow-sm transition-colors hover:text-primary"
            >
              <MaterialIcon name="chevron_left" className="text-xl" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => goTo(index + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface shadow-sm transition-colors hover:text-primary"
            >
              <MaterialIcon name="chevron_right" className="text-xl" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-lg">
        <div className="relative h-[320px] w-full bg-secondary-fixed-dim sm:h-[420px]">
          <img
            key={active.id}
            src={active.imageUrl}
            alt={active.title}
            className="h-full w-full object-cover transition-opacity duration-150"
          />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-on-surface/80 via-transparent to-transparent p-6 lg:p-8">
            <div className="text-surface-container-lowest">
              <span className="rounded bg-primary px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide text-on-primary">
                {active.tag}
              </span>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {active.title}
              </h3>
              <p className="mt-1 max-w-2xl font-sans text-sm text-surface-container-high">
                {active.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-surface-container-lowest p-4 md:grid-cols-4">
          {slides.slice(0, 8).map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                'flex flex-col gap-1 rounded-lg p-2 text-left transition-all',
                i === index
                  ? 'bg-surface-container-high'
                  : 'bg-surface-container-low hover:bg-surface-container',
              )}
            >
              <span
                className={cn(
                  'font-mono text-[11px] font-bold',
                  i === index ? 'text-primary' : 'text-on-surface-variant',
                )}
              >
                {String(i + 1).padStart(2, '0')}. {slide.title}
              </span>
              <span className="truncate font-sans text-xs text-on-surface">
                {slide.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
