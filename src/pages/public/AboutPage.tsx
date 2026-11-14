import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { SocialLinks } from '@/components/common/SocialLinks'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchProfile } from '@/services/profile'
import { fetchSocialLinks } from '@/services/social'

async function loadAbout() {
  const [profile, socialLinks] = await Promise.all([
    fetchProfile(),
    fetchSocialLinks(),
  ])
  return { profile, socialLinks }
}

export function AboutPage() {
  const { data, error, loading, reload } = useAsyncData(loadAbout)

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const profile = data?.profile
  const socialLinks = data?.socialLinks ?? []

  if (!profile) {
    return (
      <div>
        <PageHeader title="About Me" />
        <EmptyState
          title="No profile content yet"
          description="Add your biography and related details from the admin profile module."
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="About Me"
        description={profile.title || undefined}
      />

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {profile.profile_image_url ? (
          <img
            src={profile.profile_image_url}
            alt={profile.full_name}
            className="mx-auto aspect-square w-full max-w-[240px] rounded-2xl border object-cover shadow-sm"
          />
        ) : null}

        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Professional Biography</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
              {profile.bio || 'Biography will appear here once added in the admin dashboard.'}
            </p>
          </section>

          {profile.career_objective ? (
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Career Objectives</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                {profile.career_objective}
              </p>
            </section>
          ) : null}

          {profile.technical_interests ? (
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Technical Interests</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                {profile.technical_interests}
              </p>
            </section>
          ) : null}

          {profile.specialization ? (
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Specialization</h2>
              <p className="mt-3 text-muted-foreground">{profile.specialization}</p>
            </section>
          ) : null}

          <SocialLinks links={socialLinks} email={profile.email} />
        </div>
      </div>
    </div>
  )
}
