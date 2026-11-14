import { useMemo, useState } from 'react'

import { MaterialIcon } from '@/components/public/MaterialIcon'
import { SectionEyebrow } from '@/components/public/SectionEyebrow'
import type { PublicHobby } from '@/services/hobbies'
import type { PageSection, SectionContentMap } from '@/services/cms'
import { parseContentBoolean } from '@/lib/cms-defaults'
import { cn } from '@/lib/utils'

interface HobbiesSectionProps {
  hobbies: PublicHobby[]
  section?: PageSection | null
  content?: SectionContentMap
}

function hobbyIcon(name: string, fallback?: string | null) {
  if (fallback?.trim()) return fallback.trim()
  const key = name.toLowerCase()
  if (key.includes('volley')) return 'sports_volleyball'
  if (key.includes('badminton') || key.includes('tennis')) return 'sports_tennis'
  if (key.includes('photo')) return 'photo_camera'
  if (key.includes('music')) return 'music_note'
  if (key.includes('read')) return 'menu_book'
  return 'interests'
}

export function HobbiesSection({
  hobbies,
  section,
  content = {},
}: HobbiesSectionProps) {
  const [activeHobbyId, setActiveHobbyId] = useState<string | null>(null)
  const [slideIdx, setSlideIdx] = useState(0)

  const activeHobby = useMemo(
    () => hobbies.find((hobby) => hobby.id === activeHobbyId) ?? null,
    [activeHobbyId, hobbies],
  )

  const slides = activeHobby?.hobby_media ?? []
  const currentSlide = slides[slideIdx]
  const showWhenEmpty = parseContentBoolean(content.show_when_empty)
  const emptyMessage = content.empty_state_message?.trim()

  function openGallery(hobbyId: string) {
    setActiveHobbyId(hobbyId)
    setSlideIdx(0)
  }

  function closeGallery() {
    setActiveHobbyId(null)
    setSlideIdx(0)
  }

  if (hobbies.length === 0 && !showWhenEmpty) return null

  return (
    <>
      <section id="hobbies" className="w-full bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-12 flex flex-col items-start gap-2">
            <SectionEyebrow>{section?.eyebrow || 'Life • 06'}</SectionEyebrow>
            <h2 className="font-display text-3xl font-bold text-on-surface lg:text-4xl">
              {section?.heading || 'Beyond the Code'}
            </h2>
            <p className="max-w-2xl text-base text-secondary">
              {section?.subtitle ||
                'A glimpse into interests and activities outside technology.'}
            </p>
          </div>
          {hobbies.length === 0 && emptyMessage ? (
            <p className="rounded-2xl bg-surface-container-lowest px-6 py-10 text-center text-sm text-on-surface-variant shadow-sm">
              {emptyMessage}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {hobbies.map((hobby) => (
              <div
                key={hobby.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative h-48 overflow-hidden bg-surface-container-high">
                  {hobby.cover_image_url || hobby.hobby_media[0]?.image_url ? (
                    <img
                      src={
                        hobby.cover_image_url ||
                        hobby.hobby_media[0]?.image_url
                      }
                      alt={hobby.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <MaterialIcon
                        name={hobbyIcon(hobby.name, hobby.icon)}
                        className="text-4xl text-primary-container"
                      />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-surface-container-lowest/90 px-2.5 py-1 font-mono text-[11px] text-on-surface backdrop-blur">
                    <MaterialIcon
                      name={hobbyIcon(hobby.name, hobby.icon)}
                      className="text-sm text-primary-container"
                    />
                    <span>{hobby.category}</span>
                  </div>
                </div>
                <div className="flex flex-grow flex-col gap-3 p-6">
                  <h3 className="font-display text-xl font-bold text-on-surface">
                    {hobby.name}
                  </h3>
                  <p className="flex-grow text-sm text-on-surface-variant">
                    {hobby.short_description ||
                      hobby.detailed_description ||
                      'Personal interest from the portfolio database.'}
                  </p>
                  {hobby.hobby_media.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => openGallery(hobby.id)}
                      className="mt-2 inline-flex items-center justify-between rounded-lg bg-surface-container px-4 py-2 font-mono text-[11px] text-on-surface transition-colors hover:bg-surface-container-high"
                    >
                      <span>Explore Gallery</span>
                      <MaterialIcon name="photo_library" className="text-sm" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div
        className={cn(
          'fixed inset-0 z-50 items-center justify-center bg-inverse-surface/80 p-4 backdrop-blur-md',
          activeHobby ? 'flex' : 'hidden',
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeGallery()
        }}
      >
        {activeHobby ? (
          <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center justify-between bg-surface-container-low p-4">
              <div className="flex items-center gap-2">
                <MaterialIcon
                  name={hobbyIcon(activeHobby.name, activeHobby.icon)}
                  className="text-primary-container"
                />
                <span className="font-display text-base font-bold text-on-surface">
                  {activeHobby.name} Gallery
                </span>
              </div>
              <button
                type="button"
                onClick={closeGallery}
                className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <MaterialIcon name="close" className="text-xl" />
              </button>
            </div>

            <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-inverse-surface">
              {currentSlide ? (
                <img
                  src={currentSlide.image_url}
                  alt={currentSlide.caption || activeHobby.name}
                  className="h-full w-full object-contain"
                />
              ) : null}
              {slides.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous"
                    onClick={() =>
                      setSlideIdx(
                        (idx) => (idx - 1 + slides.length) % slides.length,
                      )
                    }
                    className="absolute left-4 rounded-full bg-surface-container-lowest/80 p-2 text-on-surface shadow transition-colors hover:bg-surface-container-lowest"
                  >
                    <MaterialIcon name="chevron_left" className="text-lg" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next"
                    onClick={() =>
                      setSlideIdx((idx) => (idx + 1) % slides.length)
                    }
                    className="absolute right-4 rounded-full bg-surface-container-lowest/80 p-2 text-on-surface shadow transition-colors hover:bg-surface-container-lowest"
                  >
                    <MaterialIcon name="chevron_right" className="text-lg" />
                  </button>
                </>
              ) : null}
            </div>

            <div className="flex items-center justify-between bg-surface-container-low p-4">
              <span className="text-sm text-secondary">
                {currentSlide?.caption ||
                  activeHobby.short_description ||
                  'Gallery moment.'}
              </span>
              <span className="font-mono text-[11px] text-primary-container">
                {slideIdx + 1} / {slides.length || 1}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
