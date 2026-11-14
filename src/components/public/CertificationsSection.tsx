import { MaterialIcon } from '@/components/public/MaterialIcon'
import { SectionEyebrow } from '@/components/public/SectionEyebrow'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PageSection } from '@/services/cms'
import type { Award, AwardCategory, Certification } from '@/types/database'
import { formatDate, getYear } from '@/utils/date'

interface CertificationsSectionProps {
  certifications: Certification[]
  awards?: Award[]
  awardCategories?: AwardCategory[]
  showCertifications?: boolean
  showAwards?: boolean
  section?: PageSection | null
}

function awardCategoryLabel(award: Award, categories?: AwardCategory[]) {
  if (award.custom_category) return award.custom_category
  if (award.award_category_id && categories?.length) {
    return (
      categories.find((cat) => cat.id === award.award_category_id)?.name ??
      'Achievement'
    )
  }
  return 'Achievement'
}

function CertificationCard({
  cert,
  wide,
}: {
  cert: Certification
  wide?: boolean
}) {
  return (
    <div
      className={
        wide
          ? 'flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-6 shadow-sm md:col-span-2 lg:col-span-2'
          : 'flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-6 shadow-sm'
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-secondary-container px-2.5 py-1 font-mono text-[11px] text-on-secondary-fixed">
          {cert.certification_type || cert.category || 'Verified'}
        </span>
        <span className="font-mono text-[11px] text-secondary">
          {formatDate(cert.issued_at) || getYear(cert.issued_at) || '—'}
        </span>
      </div>
      <h3 className="font-display text-xl font-bold text-on-surface">
        {cert.title}
      </h3>
      {cert.qualification_name ? (
        <p className="text-sm text-on-surface-variant">{cert.qualification_name}</p>
      ) : null}
      <p className="flex-grow text-sm text-on-surface-variant">{cert.issuer}</p>
      {cert.show_credential_number && cert.credential_number ? (
        <p className="font-mono text-[11px] text-secondary">
          ID: {cert.credential_number}
        </p>
      ) : null}
      {cert.credential_url ? (
        <a
          href={cert.credential_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 pt-2 font-mono text-[11px] text-primary-container no-underline hover:underline"
        >
          <MaterialIcon name="verified" className="text-sm" />
          <span>View Credential</span>
        </a>
      ) : (
        <div className="inline-flex items-center gap-2 pt-2 font-mono text-[11px] text-primary-container">
          <MaterialIcon name="verified" className="text-sm" />
          <span>{cert.issuer}</span>
        </div>
      )}
    </div>
  )
}

function AwardCard({ award, categories }: { award: Award; categories?: AwardCategory[] }) {
  return (
    <article className="flex flex-col gap-3 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
      {award.image_url ? (
        <img
          src={award.image_url}
          alt=""
          className="aspect-[16/9] w-full object-cover"
        />
      ) : null}
      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-secondary-container px-2.5 py-1 font-mono text-[11px] text-on-secondary-fixed">
            {awardCategoryLabel(award, categories)}
          </span>
          <span className="font-mono text-[11px] text-secondary">
            {formatDate(award.received_at) || getYear(award.received_at) || '—'}
          </span>
        </div>
        <h3 className="font-display text-xl font-bold text-on-surface">{award.title}</h3>
        {award.issuer ? (
          <p className="flex-grow text-sm text-on-surface-variant">{award.issuer}</p>
        ) : null}
        {award.description ? (
          <p className="text-sm text-on-surface-variant">{award.description}</p>
        ) : null}
        {award.credential_url ? (
          <a
            href={award.credential_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 pt-2 font-mono text-[11px] text-primary-container no-underline hover:underline"
          >
            <MaterialIcon name="verified" className="text-sm" />
            <span>View Credential</span>
          </a>
        ) : null}
      </div>
    </article>
  )
}

function CertificationsGrid({
  certifications,
}: {
  certifications: Certification[]
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {certifications.map((cert, index) => {
        const wide =
          index === certifications.length - 1 && certifications.length % 3 === 2
        return <CertificationCard key={cert.id} cert={cert} wide={wide} />
      })}
    </div>
  )
}

function AwardsGrid({
  awards,
  categories,
}: {
  awards: Award[]
  categories?: AwardCategory[]
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {awards.map((award) => (
        <AwardCard key={award.id} award={award} categories={categories} />
      ))}
    </div>
  )
}

export function CertificationsSection({
  certifications,
  awards = [],
  awardCategories,
  showCertifications = true,
  showAwards = true,
  section,
}: CertificationsSectionProps) {
  const visibleCerts = showCertifications ? certifications : []
  const visibleAwards = showAwards ? awards : []

  if (visibleCerts.length === 0 && visibleAwards.length === 0) return null

  const showTabs = visibleCerts.length > 0 && visibleAwards.length > 0

  return (
    <section
      id="certifications"
      className="w-full bg-surface-container-low/40 py-20"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-12 flex flex-col items-start gap-2">
          <SectionEyebrow>
            {section?.eyebrow || 'Validation • 07'}
          </SectionEyebrow>
          <h2 className="font-display text-3xl font-bold text-on-surface lg:text-4xl">
            {section?.heading || 'Certifications & Achievements'}
          </h2>
          <p className="max-w-2xl text-base text-secondary">
            {section?.subtitle ||
              'Standardized credentials and industry-recognized certifications from the live database.'}
          </p>
        </div>

        {showTabs ? (
          <Tabs defaultValue="certifications">
            <TabsList className="mb-8">
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="awards">Awards</TabsTrigger>
            </TabsList>
            <TabsContent value="certifications">
              <CertificationsGrid certifications={visibleCerts} />
            </TabsContent>
            <TabsContent value="awards">
              <AwardsGrid awards={visibleAwards} categories={awardCategories} />
            </TabsContent>
          </Tabs>
        ) : visibleCerts.length > 0 ? (
          <CertificationsGrid certifications={visibleCerts} />
        ) : (
          <AwardsGrid awards={visibleAwards} categories={awardCategories} />
        )}
      </div>
    </section>
  )
}