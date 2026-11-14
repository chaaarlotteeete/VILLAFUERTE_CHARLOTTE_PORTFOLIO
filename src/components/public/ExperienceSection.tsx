import { MaterialIcon } from '@/components/public/MaterialIcon'
import { SectionEyebrow } from '@/components/public/SectionEyebrow'
import type { PageSection, SectionContentMap } from '@/services/cms'
import type { EducationWithRelations } from '@/services/education'
import type { Experience } from '@/types/database'
import { formatDateRange } from '@/utils/date'

interface ExperienceSectionProps {
  experiences: Experience[]
  education: EducationWithRelations[]
  section?: PageSection | null
  content?: SectionContentMap
}

function educationDisplayTitle(item: EducationWithRelations) {
  const levelSlug =
    item.education_levels?.slug ||
    (item.custom_education_level ? 'other' : null)
  const trackName = item.custom_track || item.education_tracks?.name || null
  const strandName = item.custom_strand || item.education_strands?.name || null

  if (levelSlug === 'senior-high') {
    return strandName || trackName || item.degree || 'Senior High School'
  }
  if (levelSlug === 'elementary' || levelSlug === 'junior-high') {
    return item.education_levels?.name || item.degree
  }
  return item.degree
}

function educationDisplayMeta(item: EducationWithRelations) {
  const levelName =
    item.education_levels?.name || item.custom_education_level || null
  const trackName = item.custom_track || item.education_tracks?.name || null
  const levelSlug = item.education_levels?.slug

  if (levelSlug === 'senior-high') {
    const title = educationDisplayTitle(item)
    return [levelName, trackName]
      .filter((part): part is string => Boolean(part) && part !== title)
      .filter((part, index, arr) => arr.indexOf(part) === index)
      .join(' · ')
  }

  if (levelSlug === 'elementary' || levelSlug === 'junior-high') {
    return ''
  }

  return [levelName].filter(Boolean).join(' · ')
}

export function ExperienceSection({
  experiences,
  education,
  section,
  content = {},
}: ExperienceSectionProps) {
  const experienceHeading =
    content.experience_column_heading?.trim() ||
    'Professional Experience & Leadership'
  const educationHeading =
    content.education_column_heading?.trim() || 'Education'
  const highlightsHeading = content.highlights_heading?.trim() || 'Highlights'

  return (
    <section id="experience" className="w-full bg-surface-container-low/40 py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-12 flex flex-col items-start gap-2">
          <SectionEyebrow>{section?.eyebrow || 'Timeline • 05'}</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold text-on-surface lg:text-4xl">
            {section?.heading || 'Experience & Academic Foundation'}
          </h2>
          <p className="max-w-2xl text-base text-secondary">
            {section?.subtitle ||
              'Demonstrated technical leadership, internship impact, and continuous academic achievement.'}
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <div className="flex items-center gap-3 pb-2">
              <MaterialIcon
                name="work"
                className="text-2xl text-primary-container"
              />
              <h3 className="font-display text-2xl font-bold text-on-surface">
                {experienceHeading}
              </h3>
            </div>

            {experiences.length === 0 ? (
              <p className="rounded-2xl bg-surface-container-lowest p-6 text-sm text-on-surface-variant shadow-sm">
                Experience entries will appear here once added in admin.
              </p>
            ) : (
              experiences.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-xl font-bold text-on-surface">
                      {item.title}
                    </span>
                    <span
                      className={
                        index === 0
                          ? 'rounded bg-tertiary-fixed px-2.5 py-1 font-mono text-[11px] font-semibold text-tertiary'
                          : 'rounded bg-secondary-container px-2.5 py-1 font-mono text-[11px] font-semibold text-secondary'
                      }
                    >
                      {formatDateRange(
                        item.start_date,
                        item.end_date,
                        item.is_current,
                      )}
                    </span>
                  </div>
                  <div className="font-mono text-[13px] text-primary-container">
                    {item.organization}
                  </div>
                  {item.description ? (
                    <p className="text-sm text-on-surface-variant">
                      {item.description}
                    </p>
                  ) : null}
                  {item.achievements ? (
                    <p className="text-sm text-on-surface-variant whitespace-pre-line">
                      {item.achievements}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="flex items-center gap-3 pb-2">
              <MaterialIcon
                name="school"
                className="text-2xl text-primary-container"
              />
              <h3 className="font-display text-2xl font-bold text-on-surface">
                {educationHeading}
              </h3>
            </div>

            {education.length === 0 ? (
              <p className="rounded-2xl bg-surface-container-lowest p-6 text-sm text-on-surface-variant shadow-sm">
                Education entries will appear here once added in admin.
              </p>
            ) : (
              education.map((item) => {
                const studying =
                  item.is_current || item.status === 'currently_studying'
                const location = [item.city, item.province]
                  .filter(Boolean)
                  .join(', ')
                const title = educationDisplayTitle(item)
                const meta = educationDisplayMeta(item)
                const showSpecialization =
                  Boolean(item.specialization) &&
                  item.education_levels?.slug !== 'senior-high' &&
                  item.education_levels?.slug !== 'elementary' &&
                  item.education_levels?.slug !== 'junior-high'

                return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-display text-xl font-bold text-on-surface">
                      {title}
                    </span>
                    {meta ? (
                      <span className="font-mono text-[11px] text-secondary">
                        {meta}
                      </span>
                    ) : null}
                    {showSpecialization ? (
                      <span className="font-mono text-[13px] text-primary-container">
                        {item.specialization}
                      </span>
                    ) : null}
                    <span className="font-mono text-[11px] text-secondary">
                      {item.institution}
                      {location ? ` • ${location}` : ''}
                    </span>
                    <span className="font-mono text-[11px] text-secondary">
                      {formatDateRange(
                        item.start_date,
                        item.end_date,
                        studying,
                        item.start_date_precision,
                        item.end_date_precision,
                      )}
                      {studying ? ' • Currently studying' : ''}
                    </span>
                  </div>
                  {item.description ? (
                    <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4">
                      <div className="flex items-center gap-2">
                        <MaterialIcon
                          name="star"
                          className="text-lg text-tertiary"
                        />
                        <span className="text-[13px] font-semibold text-on-surface">
                          {highlightsHeading}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-line text-on-surface-variant">
                        {item.description}
                      </p>
                    </div>
                  ) : null}
                </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
