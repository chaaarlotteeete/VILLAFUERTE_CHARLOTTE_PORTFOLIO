import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { TimelineList } from '@/components/common/TimelineList'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchExperiences } from '@/services/experience'

export function ExperiencePage() {
  const { data, error, loading, reload } = useAsyncData(fetchExperiences)

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const experiences = data ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Experience"
        description="Professional and organizational experience loaded from Supabase."
      />

      {experiences.length === 0 ? (
        <EmptyState title="No experience entries yet" />
      ) : (
        <TimelineList
          items={experiences.map((item) => ({
            id: item.id,
            title: item.title,
            organization: item.organization,
            startDate: item.start_date,
            endDate: item.end_date,
            isCurrent: item.is_current,
            description: item.description,
            achievements: item.achievements,
          }))}
        />
      )}
    </div>
  )
}
