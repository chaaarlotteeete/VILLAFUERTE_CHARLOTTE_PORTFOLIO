import { MaterialIcon } from '@/components/public/MaterialIcon'
import { SectionEyebrow } from '@/components/public/SectionEyebrow'
import { parseContentBoolean } from '@/lib/cms-defaults'
import { formatDate } from '@/utils/date'
import type { PageSection, SectionContentMap, SpecializationCard } from '@/services/cms'
import type { Education, Profile, Skill } from '@/types/database'

interface AboutSectionProps {
  profile: Profile | null
  education: Education[]
  skills: Skill[]
  section?: PageSection | null
  content?: SectionContentMap
  specializationCards?: SpecializationCard[]
}

const FALLBACK_CARDS = [
  {
    id: 'fallback-1',
    icon: 'devices',
    title: 'Web & Mobile Development',
    description:
      'Building performant web interfaces and cross-platform mobile apps with adaptive layouts and offline-first persistence.',
    tone: 'bg-primary-fixed text-primary-container',
    tags: ['React', 'Next.js', 'Flutter', 'Dart', 'Tailwind'],
  },
  {
    id: 'fallback-2',
    icon: 'fact_check',
    title: 'System Analysis & SQA',
    description:
      'Translating complex workflows into SRS documentation, ERDs, UML diagrams, and automated regression test pipelines.',
    tone: 'bg-secondary-container text-secondary',
    tags: ['SRS / UML', 'Postman', 'Jest', 'Cypress'],
  },
  {
    id: 'fallback-3',
    icon: 'neurology',
    title: 'API & AI Integration',
    description:
      'Designing relational schemas and chaining LLM endpoints for intelligent data enrichment and agent assistants.',
    tone: 'bg-tertiary-fixed text-tertiary',
    tags: ['FastAPI', 'Supabase', 'PostgreSQL', 'OpenAI'],
  },
]

export function AboutSection({
  profile,
  education,
  skills,
  section,
  content = {},
  specializationCards = [],
}: AboutSectionProps) {
  const bio =
    profile?.bio ||
    profile?.career_objective ||
    'I analyze real-world workflows, map requirements into architectural specifications, and ship maintainable digital products.'
  const paragraphs = bio
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const primaryEdu = education[0]
  const skillTags = skills.slice(0, 12).map((s) => s.name)
  const showVitals = content.show_vitals
    ? parseContentBoolean(content.show_vitals)
    : true
  const cardHeading =
    content.card_heading?.trim() || 'Architecting Systems that Scale & Endure'
  const cardDescription = content.card_description?.trim()
  const vitalsHeading = content.vitals_heading?.trim() || 'Profile Vitals'
  const workModel = content.work_model?.trim() || 'Hybrid / Remote / On-Site'

  const cards =
    specializationCards.length > 0
      ? specializationCards.map((card) => ({
          id: card.id,
          icon: card.icon,
          title: card.title,
          description: card.description,
          tone: card.tone,
          tags: [] as string[],
        }))
      : FALLBACK_CARDS

  return (
    <section id="about" className="w-full bg-surface-container-low/50 py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-12 flex flex-col items-start gap-2">
          <SectionEyebrow>
            {section?.eyebrow || 'System Overview • 01'}
          </SectionEyebrow>
          <h2 className="font-display text-3xl font-bold text-on-surface lg:text-4xl">
            {section?.heading || 'Bridging Business Logic & Engineering Rigor'}
          </h2>
          <p className="max-w-2xl text-base text-secondary">
            {section?.subtitle ||
              "I don't just write application code; I analyze complex real-world workflows, map requirements into formal architectural specifications, and ship maintainable digital products."}
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
          <div className="flex h-full flex-col gap-6">
            <div className="flex h-full flex-col gap-4 rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
              <h3 className="font-display text-xl font-semibold text-on-surface">
                {cardHeading}
              </h3>
              {cardDescription ? (
                <p className="leading-relaxed text-on-surface-variant">
                  {cardDescription}
                </p>
              ) : null}
              {paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className="leading-relaxed text-on-surface-variant"
                >
                  {paragraph}
                </p>
              ))}
              <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
                {[
                  { icon: 'architecture', title: 'SRS & UML', sub: 'Defensive Specs' },
                  { icon: 'speed', title: 'API Design', sub: 'Optimized Queries' },
                  { icon: 'verified_user', title: 'QA Automation', sub: 'Verified Flows' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-lg bg-surface-container p-3.5"
                  >
                    <MaterialIcon
                      name={item.icon}
                      className="text-primary-container"
                    />
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] font-semibold text-on-surface">
                        {item.title}
                      </span>
                      <span className="font-mono text-[11px] text-secondary">
                        {item.sub}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showVitals ? (
            <div className="flex h-full flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-2.5">
                <MaterialIcon
                  name="contact_page"
                  className="text-xl text-primary-container"
                />
                <span className="font-display text-base font-semibold text-on-surface">
                  {vitalsHeading}
                </span>
              </div>
              <div className="flex flex-col gap-4 text-sm">
                {[
                  {
                    label: 'Degree',
                    value: primaryEdu?.degree || 'BS Information Tech',
                  },
                  {
                    label: 'Graduation',
                    value: primaryEdu
                      ? primaryEdu.is_current
                        ? 'In Progress'
                        : formatDate(primaryEdu.end_date) || '—'
                      : '—',
                    accent: true,
                  },
                  {
                    label: 'Location',
                    value: profile?.location || 'Metro Manila, Philippines',
                  },
                  profile?.birthdate
                    ? {
                        label: 'Birthdate',
                        value:
                          formatDate(profile.birthdate, 'MMM d, yyyy') ||
                          profile.birthdate,
                      }
                    : null,
                  profile?.birthplace
                    ? { label: 'Birthplace', value: profile.birthplace }
                    : null,
                  profile?.gender
                    ? { label: 'Gender', value: profile.gender }
                    : null,
                  profile?.religion
                    ? { label: 'Religion', value: profile.religion }
                    : null,
                  profile?.nationality
                    ? { label: 'Nationality', value: profile.nationality }
                    : null,
                  profile?.civil_status
                    ? { label: 'Civil Status', value: profile.civil_status }
                    : null,
                  {
                    label: 'Core Focus',
                    value: profile?.specialization || 'Full-Stack & Systems',
                    accentPrimary: true,
                  },
                  {
                    label: 'Work Model',
                    value: workModel,
                  },
                ]
                  .filter(
                    (
                      row,
                    ): row is NonNullable<typeof row> => row != null,
                  )
                  .map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2"
                  >
                    <span className="font-mono text-[11px] text-secondary">
                      {row.label}
                    </span>
                    <span
                      className={
                        row.accent
                          ? 'font-mono text-[13px] font-semibold text-tertiary'
                          : row.accentPrimary
                            ? 'font-mono text-[13px] font-semibold text-primary-container'
                            : 'font-mono text-[13px] font-semibold text-on-surface'
                      }
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div
          className={`grid grid-cols-1 gap-6 ${
            cards.length >= 3 ? 'md:grid-cols-3' : cards.length === 2 ? 'md:grid-cols-2' : ''
          }`}
        >
          {cards.map((card, cardIndex) => {
            const tags =
              card.tags.length > 0
                ? card.tags
                : skillTags.length >= 3
                  ? skillTags.slice(cardIndex * 4, cardIndex * 4 + 5)
                  : skillTags.slice(0, 5)
            const resolvedTags = tags.length > 0 ? tags : ['Skills']

            return (
              <div
                key={card.id}
                className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className={`mb-2 flex h-12 w-12 items-center justify-center rounded-xl ${card.tone}`}
                >
                  <MaterialIcon name={card.icon} className="text-2xl" />
                </div>
                <h4 className="font-display text-xl font-semibold text-on-surface">
                  {card.title}
                </h4>
                <p className="flex-grow text-sm text-on-surface-variant">
                  {card.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {resolvedTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-surface-container px-2.5 py-1 font-mono text-[11px] text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
