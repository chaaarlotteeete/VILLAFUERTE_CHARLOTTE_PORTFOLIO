import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { TimelineList } from '@/components/common/TimelineList'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchEducation } from '@/services/education'

export function EducationPage() {
  const { data, error, loading, reload } = useAsyncData(fetchEducation)

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const education = data ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Education"
        description="Educational background and qualifications from Supabase."
      />

      {education.length === 0 ? (
        <EmptyState title="No education entries yet" />
      ) : (
        <TimelineList
          items={education.map((item) => ({
            id: item.id,
            title: item.degree,
            organization: item.institution,
            startDate: item.start_date,
            endDate: item.end_date,
            isCurrent: item.is_current,
            description: item.description,
          }))}
        />
      )}
    </div>
  )
}
