import { useMemo, useState } from 'react'

import { MaterialIcon } from '@/components/public/MaterialIcon'
import { SectionEyebrow } from '@/components/public/SectionEyebrow'
import { DEFAULT_SKILL_FILTERS } from '@/lib/cms-defaults'
import { skillIconFor } from '@/lib/public-nav'
import { cn } from '@/lib/utils'
import type { PageSection, SkillCategory } from '@/services/cms'
import type { Skill } from '@/types/database'

interface SkillsSectionProps {
  skills: Skill[]
  section?: PageSection | null
  skillCategories?: SkillCategory[]
}

export function SkillsSection({
  skills,
  section,
  skillCategories = [],
}: SkillsSectionProps) {
  const [filter, setFilter] = useState<string>('all')

  const availableFilters = useMemo(() => {
    const present = new Set(skills.map((skill) => skill.category))
    const categories =
      skillCategories.length > 0
        ? skillCategories.map((cat) => ({ key: cat.name, label: cat.label }))
        : DEFAULT_SKILL_FILTERS.filter((item) => item.key !== 'all').map((item) => ({
            key: item.key,
            label: item.label,
          }))
    return [
      { key: 'all', label: 'All Stack' },
      ...categories.filter((item) => present.has(item.key)),
    ]
  }, [skills, skillCategories])

  const visible = useMemo(() => {
    if (filter === 'all') return skills
    return skills.filter((skill) => skill.category === filter)
  }, [filter, skills])

  return (
    <section id="skills" className="w-full bg-surface py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <SectionEyebrow>
              {section?.eyebrow || 'Competency Grid • 02'}
            </SectionEyebrow>
            <h2 className="mt-2 font-display text-3xl font-bold text-on-surface lg:text-4xl">
              {section?.heading || 'Technical Skills & Proficiency Matrix'}
            </h2>
            <p className="mt-2 text-base text-secondary">
              {section?.subtitle ||
                'Categorized overview of languages, runtimes, databases, and analysis frameworks from the live portfolio database.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 overflow-x-auto pb-6">
          {availableFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={cn(
                'rounded-lg px-4 py-2 font-mono text-[11px] transition-all',
                filter === item.key
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="rounded-xl bg-surface-container-low px-4 py-8 text-center text-sm text-on-surface-variant">
            No skills published yet. Add them in the admin dashboard.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {visible.map((skill) => (
              <div
                key={skill.id}
                className="flex flex-col items-start gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-sm transition-all hover:-translate-y-1"
              >
                <MaterialIcon
                  name={skillIconFor(skill.name, skill.icon)}
                  className="text-2xl text-primary-container"
                />
                <span className="font-display text-base font-semibold text-on-surface">
                  {skill.name}
                </span>
                <span className="font-mono text-[11px] text-secondary">
                  {skill.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
