import { Eye, Pencil, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PROJECT_STATUSES, PROJECT_TYPES } from '@/lib/constants'
import {
  deleteProject,
  fetchAdminProjects,
  updateProjectFlags,
} from '@/services/adminProjects'
import type { Project } from '@/types/database'
import { formatDate } from '@/utils/date'

type SortKey = 'updated_desc' | 'updated_asc' | 'title_asc' | 'order_asc'

export function AdminProjectsPage() {
  const { data, error, loading, reload } = useAsyncData(fetchAdminProjects)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('updated_desc')

  const projects = useMemo(() => {
    let list = [...(data ?? [])]
    const query = search.trim().toLowerCase()

    if (query) {
      list = list.filter((project) =>
        [project.title, project.slug, project.role, project.short_description]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query)),
      )
    }
    if (statusFilter !== 'all') {
      list = list.filter((project) => project.status === statusFilter)
    }
    if (typeFilter !== 'all') {
      list = list.filter((project) => project.project_type === typeFilter)
    }

    list.sort((a, b) => {
      switch (sort) {
        case 'updated_asc':
          return a.updated_at.localeCompare(b.updated_at)
        case 'title_asc':
          return a.title.localeCompare(b.title)
        case 'order_asc':
          return a.display_order - b.display_order
        case 'updated_desc':
        default:
          return b.updated_at.localeCompare(a.updated_at)
      }
    })

    return list
  }, [data, search, statusFilter, typeFilter, sort])

  async function togglePublish(project: Project) {
    try {
      await updateProjectFlags(project.id, {
        is_published: !project.is_published,
      })
      toast.success(project.is_published ? 'Unpublished' : 'Published')
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function archive(project: Project) {
    try {
      await updateProjectFlags(project.id, {
        status: 'Archived',
        is_published: false,
      })
      toast.success('Project archived')
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Archive failed')
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Search, filter, publish, and manage portfolio projects."
        actions={
          <Button asChild>
            <Link to="/admin/projects/new">Add Project</Link>
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PROJECT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Project type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {PROJECT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_desc">Last updated</SelectItem>
            <SelectItem value="updated_asc">Oldest updated</SelectItem>
            <SelectItem value="title_asc">Title A–Z</SelectItem>
            <SelectItem value="order_asc">Display order</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(data ?? []).length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start filling the portfolio."
          action={
            <Button asChild>
              <Link to="/admin/projects/new">Add Project</Link>
            </Button>
          }
        />
      ) : projects.length === 0 ? (
        <EmptyState title="No matching projects" />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Featured</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {project.thumbnail_url ? (
                          <img
                            src={project.thumbnail_url}
                            alt=""
                            className="size-12 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="flex size-12 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{project.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {project.slug}
                          </p>
                          <Badge
                            variant={project.is_published ? 'success' : 'secondary'}
                            className="mt-1"
                          >
                            {project.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{project.project_type}</td>
                    <td className="px-4 py-3">{project.role || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{project.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(project.updated_at, 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      {project.is_featured ? (
                        <Badge className="gap-1">
                          <Star className="size-3" /> Featured
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ProjectActions
                        project={project}
                        onPublish={() => void togglePublish(project)}
                        onArchive={() => void archive(project)}
                        onDeleted={reload}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="space-y-3 md:hidden">
            {projects.map((project) => (
              <div key={project.id} className="rounded-xl border bg-card p-4">
                <div className="flex gap-3">
                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt=""
                      className="size-16 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                      N/A
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">{project.slug}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{project.project_type}</Badge>
                      <Badge variant="outline">{project.status}</Badge>
                      <Badge
                        variant={project.is_published ? 'success' : 'secondary'}
                      >
                        {project.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      {project.is_featured ? <Badge>Featured</Badge> : null}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Role: {project.role || '—'} · Updated{' '}
                      {formatDate(project.updated_at, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <ProjectActions
                    project={project}
                    onPublish={() => void togglePublish(project)}
                    onArchive={() => void archive(project)}
                    onDeleted={reload}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ProjectActions({
  project,
  onPublish,
  onArchive,
  onDeleted,
}: {
  project: Project
  onPublish: () => void
  onArchive: () => void
  onDeleted: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="ghost">
        <Link to={`/projects/${project.slug}`} target="_blank" rel="noreferrer">
          <Eye />
          View
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link to={`/admin/projects/${project.id}/edit`}>
          <Pencil />
          Edit
        </Link>
      </Button>
      <Button asChild size="sm" variant="ghost">
        <Link to={`/projects/${project.slug}`} target="_blank" rel="noreferrer">
          Preview
        </Link>
      </Button>
      <Button size="sm" variant="secondary" onClick={onPublish}>
        {project.is_published ? 'Unpublish' : 'Publish'}
      </Button>
      <Button size="sm" variant="outline" onClick={onArchive}>
        Archive
      </Button>
      <ConfirmDeleteButton
        title="Delete project?"
        description="This permanently deletes the project and related features, media, and contributions."
        onConfirm={async () => {
          await deleteProject(project.id)
          toast.success('Project deleted')
          onDeleted()
        }}
      />
    </div>
  )
}
