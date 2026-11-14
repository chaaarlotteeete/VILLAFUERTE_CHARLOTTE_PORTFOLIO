import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PROJECT_PLATFORMS,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from '@/lib/constants'
import type { ProjectFilters as Filters, ProjectSort } from '@/types/portfolio'

interface ProjectFiltersProps {
  filters: Filters
  technologyOptions: string[]
  yearOptions: string[]
  onChange: (next: Filters) => void
}

export function ProjectFiltersBar({
  filters,
  technologyOptions,
  yearOptions,
  onChange,
}: ProjectFiltersProps) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="project-search">Search</Label>
        <Input
          id="project-search"
          placeholder="Search by title, description, or role"
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FilterSelect
          label="Status"
          value={filters.status}
          onValueChange={(status) => onChange({ ...filters, status })}
          options={['all', ...PROJECT_STATUSES]}
        />
        <FilterSelect
          label="Project type"
          value={filters.projectType}
          onValueChange={(projectType) => onChange({ ...filters, projectType })}
          options={['all', ...PROJECT_TYPES]}
        />
        <FilterSelect
          label="Platform"
          value={filters.platform}
          onValueChange={(platform) => onChange({ ...filters, platform })}
          options={['all', ...PROJECT_PLATFORMS]}
        />
        <FilterSelect
          label="Technology"
          value={filters.technology}
          onValueChange={(technology) => onChange({ ...filters, technology })}
          options={['all', ...technologyOptions]}
        />
        <FilterSelect
          label="Year"
          value={filters.year}
          onValueChange={(year) => onChange({ ...filters, year })}
          options={['all', ...yearOptions]}
        />
        <div className="space-y-2">
          <Label>Sort by</Label>
          <Select
            value={filters.sort}
            onValueChange={(sort) =>
              onChange({ ...filters, sort: sort as ProjectSort })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: readonly string[]
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option === 'all' ? `All ${label.toLowerCase()}` : option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
