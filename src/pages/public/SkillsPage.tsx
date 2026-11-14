import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { useAsyncData } from '@/hooks/useAsyncData'
import { SKILL_CATEGORIES } from '@/lib/constants'
import { fetchSkills, groupSkillsByCategory } from '@/services/skills'

export function SkillsPage() {
  const { data, error, loading, reload } = useAsyncData(fetchSkills)

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const skills = data ?? []
  const grouped = groupSkillsByCategory(skills)

  const ordered = [
    ...SKILL_CATEGORIES.map((category) => ({
      category,
      items: grouped.find((group) => group.category === category)?.items ?? [],
    })).filter((group) => group.items.length > 0),
    ...grouped.filter(
      (group) =>
        !(SKILL_CATEGORIES as readonly string[]).includes(group.category),
    ),
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Technical Skills"
        description="Skills grouped by category from the portfolio database. Proficiency percentages are omitted unless real data is provided."
      />

      {ordered.length === 0 ? (
        <EmptyState title="No skills published yet" />
      ) : (
        <div className="space-y-6">
          {ordered.map((group) => (
            <section
              key={group.category}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">{group.category}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.items.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm"
                  >
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
