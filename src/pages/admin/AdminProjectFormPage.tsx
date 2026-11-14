import { ArrowDown, ArrowUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { FileUploadField } from '@/components/admin/FileUploadField'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  PROJECT_PLATFORMS,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from '@/lib/constants'
import { absoluteUrl } from '@/lib/utils'
import {
  fetchAdminProjectById,
  fetchTechnologies,
  saveAdminProject,
} from '@/services/adminProjects'
import { getProjectTechnologies } from '@/services/projects'
import type {
  ProjectPlatform,
  ProjectStatus,
  ProjectType,
} from '@/types/database'
import { fromMonthValue, toMonthValue } from '@/utils/date'
import { slugify } from '@/utils/slug'

interface FeatureDraft {
  key: string
  title: string
  description: string
  image_url: string
}

interface ContributionDraft {
  key: string
  title: string
  description: string
}

interface MediaDraft {
  key: string
  image_url: string
  caption: string
}

interface FormState {
  title: string
  slug: string
  short_description: string
  full_description: string
  objectives: string
  project_type: ProjectType
  platform: ProjectPlatform
  role: string
  status: ProjectStatus
  start_date: string
  end_date: string
  github_url: string
  live_url: string
  docs_url: string
  video_url: string
  thumbnail_url: string
  is_published: boolean
  is_featured: boolean
  display_order: number
  technologyIds: string[]
  features: FeatureDraft[]
  contributions: ContributionDraft[]
  media: MediaDraft[]
}

function emptyForm(): FormState {
  return {
    title: '',
    slug: '',
    short_description: '',
    full_description: '',
    objectives: '',
    project_type: 'Individual',
    platform: 'Web',
    role: '',
    status: 'Ongoing',
    start_date: '',
    end_date: '',
    github_url: '',
    live_url: '',
    docs_url: '',
    video_url: '',
    thumbnail_url: '',
    is_published: false,
    is_featured: false,
    display_order: 0,
    technologyIds: [],
    features: [],
    contributions: [],
    media: [],
  }
}

function moveItem<T>(list: T[], index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export function AdminProjectFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [techSearch, setTechSearch] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [technologies, setTechnologies] = useState<
    Array<{ id: string; name: string }>
  >([])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const tech = await fetchTechnologies()
        if (!active) return
        setTechnologies(tech.map((item) => ({ id: item.id, name: item.name })))

        if (!id) {
          setLoading(false)
          return
        }

        const project = await fetchAdminProjectById(id)
        if (!active) return
        if (!project) {
          setError('Project not found')
          setLoading(false)
          return
        }

        setSlugTouched(true)
        setForm({
          title: project.title,
          slug: project.slug,
          short_description: project.short_description ?? '',
          full_description: project.full_description ?? '',
          objectives: project.objectives ?? '',
          project_type: project.project_type,
          platform: project.platform,
          role: project.role ?? '',
          status: project.status,
          start_date: toMonthValue(project.start_date),
          end_date: toMonthValue(project.end_date),
          github_url: project.github_url ?? '',
          live_url: project.live_url ?? '',
          docs_url: project.docs_url ?? '',
          video_url: project.video_url ?? '',
          thumbnail_url: project.thumbnail_url ?? '',
          is_published: project.is_published,
          is_featured: project.is_featured,
          display_order: project.display_order,
          technologyIds: getProjectTechnologies(project).map((item) => item.id),
          features: project.project_features.map((item) => ({
            key: item.id,
            title: item.title,
            description: item.description ?? '',
            image_url: item.image_url ?? '',
          })),
          contributions: project.project_contributions.map((item) => ({
            key: item.id,
            title: item.title,
            description: item.description ?? '',
          })),
          media: project.project_media.map((item) => ({
            key: item.id,
            image_url: item.image_url,
            caption: item.caption ?? '',
          })),
        })
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load project')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [id])

  const pageTitle = useMemo(
    () => (isEdit ? 'Edit Project' : 'Create Project'),
    [isEdit],
  )

  const filteredTechnologies = useMemo(() => {
    const query = techSearch.trim().toLowerCase()
    if (!query) return technologies
    return technologies.filter((item) => item.name.toLowerCase().includes(query))
  }, [technologies, techSearch])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function saveProject(options: { publish?: boolean; draft?: boolean } = {}) {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error('Title and slug are required')
      return null
    }

    const is_published = options.publish
      ? true
      : options.draft
        ? false
        : form.is_published

    setSaving(true)
    try {
      const saved = await saveAdminProject({
        project: {
          ...(id ? { id } : {}),
          title: form.title.trim(),
          slug: form.slug.trim(),
          short_description: form.short_description || null,
          full_description: form.full_description || null,
          objectives: form.objectives || null,
          project_type: form.project_type,
          platform: form.platform,
          role: form.role || null,
          status: form.status,
          start_date: fromMonthValue(form.start_date),
          end_date: fromMonthValue(form.end_date),
          github_url: form.github_url || null,
          live_url: form.live_url || null,
          docs_url: form.docs_url || null,
          video_url: form.video_url || null,
          thumbnail_url: form.thumbnail_url || null,
          is_published,
          is_featured: form.is_featured,
          display_order: Number(form.display_order) || 0,
        },
        features: form.features
          .filter((item) => item.title.trim())
          .map((item, index) => ({
            title: item.title.trim(),
            description: item.description || null,
            image_url: item.image_url || null,
            display_order: index,
          })),
        contributions: form.contributions
          .filter((item) => item.title.trim())
          .map((item, index) => ({
            title: item.title.trim(),
            description: item.description || null,
            display_order: index,
          })),
        media: form.media
          .filter((item) => item.image_url.trim())
          .map((item, index) => ({
            image_url: item.image_url.trim(),
            caption: item.caption || null,
            display_order: index,
          })),
        technologyIds: form.technologyIds,
      })

      setForm((current) => ({ ...current, is_published }))
      toast.success(
        options.publish
          ? 'Project published'
          : options.draft
            ? 'Draft saved'
            : isEdit
              ? 'Project updated'
              : 'Project created',
      )
      if (!isEdit) {
        navigate(`/admin/projects/${saved.id}/edit`, { replace: true })
      }
      return saved
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handlePreview() {
    const saved = await saveProject({ draft: !form.is_published && !id ? true : undefined })
    if (!saved) return
    window.open(absoluteUrl(`/projects/${saved.slug}`), '_blank', 'noopener,noreferrer')
  }

  if (loading) return <LoadingState rows={5} />
  if (error) return <ErrorState message={error} />

  const actionBar = (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <Link to="/admin/projects">Cancel</Link>
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={saving}
        onClick={() => void saveProject({ draft: true })}
      >
        {saving ? 'Saving...' : 'Save Draft'}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={saving}
        onClick={() => void handlePreview()}
      >
        Preview
      </Button>
      <Button
        type="button"
        disabled={saving}
        onClick={() => void saveProject({ publish: true })}
      >
        {saving ? 'Publishing...' : 'Publish'}
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        description="Structured editor for project content, media, and publishing."
        actions={actionBar}
      />

      <div className="sticky top-14 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
        <p className="text-sm text-muted-foreground">
          {form.is_published ? 'Currently published' : 'Currently a draft'}
        </p>
        {actionBar}
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="technologies">Technologies</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="publishing">Links & Publishing</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => {
                    const title = event.target.value
                    updateField('title', title)
                    if (!slugTouched) updateField('slug', slugify(title))
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true)
                    updateField('slug', slugify(event.target.value))
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={form.role}
                  onChange={(event) => updateField('role', event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Textarea
                  id="short_description"
                  value={form.short_description}
                  onChange={(event) =>
                    updateField('short_description', event.target.value)
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="full_description">Full Description</Label>
                <Textarea
                  id="full_description"
                  className="min-h-[160px]"
                  value={form.full_description}
                  onChange={(event) =>
                    updateField('full_description', event.target.value)
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="objectives">Objectives</Label>
                <Textarea
                  id="objectives"
                  value={form.objectives}
                  onChange={(event) =>
                    updateField('objectives', event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Project Type</Label>
                <Select
                  value={form.project_type}
                  onValueChange={(value) =>
                    updateField('project_type', value as ProjectType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={form.platform}
                  onValueChange={(value) =>
                    updateField('platform', value as ProjectPlatform)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_PLATFORMS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    updateField('status', value as ProjectStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timeline</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="month"
                    value={form.start_date}
                    onChange={(event) =>
                      updateField('start_date', event.target.value)
                    }
                    aria-label="Start month and year"
                  />
                  <Input
                    type="month"
                    value={form.end_date}
                    onChange={(event) =>
                      updateField('end_date', event.target.value)
                    }
                    aria-label="End month and year"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Month and year only.
                </p>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="features">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Features</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateField('features', [
                    ...form.features,
                    {
                      key: crypto.randomUUID(),
                      title: '',
                      description: '',
                      image_url: '',
                    },
                  ])
                }
              >
                Add Feature
              </Button>
            </div>
            {form.features.length === 0 ? (
              <p className="text-sm text-muted-foreground">No features yet.</p>
            ) : null}
            {form.features.map((feature, index) => (
              <div key={feature.key} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() =>
                      updateField('features', moveItem(form.features, index, -1))
                    }
                    aria-label="Move feature up"
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === form.features.length - 1}
                    onClick={() =>
                      updateField('features', moveItem(form.features, index, 1))
                    }
                    aria-label="Move feature down"
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <Input
                  placeholder="Feature title"
                  value={feature.title}
                  onChange={(event) => {
                    const next = [...form.features]
                    next[index] = { ...feature, title: event.target.value }
                    updateField('features', next)
                  }}
                />
                <Textarea
                  placeholder="Feature description"
                  value={feature.description}
                  onChange={(event) => {
                    const next = [...form.features]
                    next[index] = { ...feature, description: event.target.value }
                    updateField('features', next)
                  }}
                />
                <FileUploadField
                  label="Feature screenshot"
                  folder="project-features"
                  value={feature.image_url}
                  onUploaded={(url) => {
                    const next = [...form.features]
                    next[index] = { ...feature, image_url: url }
                    updateField('features', next)
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    updateField(
                      'features',
                      form.features.filter((item) => item.key !== feature.key),
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </section>
        </TabsContent>

        <TabsContent value="contributions">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Contributions</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateField('contributions', [
                    ...form.contributions,
                    { key: crypto.randomUUID(), title: '', description: '' },
                  ])
                }
              >
                Add Contribution
              </Button>
            </div>
            {form.contributions.map((item, index) => (
              <div key={item.key} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() =>
                      updateField(
                        'contributions',
                        moveItem(form.contributions, index, -1),
                      )
                    }
                    aria-label="Move contribution up"
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === form.contributions.length - 1}
                    onClick={() =>
                      updateField(
                        'contributions',
                        moveItem(form.contributions, index, 1),
                      )
                    }
                    aria-label="Move contribution down"
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <Input
                  placeholder="Contribution title"
                  value={item.title}
                  onChange={(event) => {
                    const next = [...form.contributions]
                    next[index] = { ...item, title: event.target.value }
                    updateField('contributions', next)
                  }}
                />
                <Textarea
                  placeholder="Contribution details"
                  value={item.description}
                  onChange={(event) => {
                    const next = [...form.contributions]
                    next[index] = { ...item, description: event.target.value }
                    updateField('contributions', next)
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    updateField(
                      'contributions',
                      form.contributions.filter((entry) => entry.key !== item.key),
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </section>
        </TabsContent>

        <TabsContent value="technologies">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <div className="space-y-2">
              <Label htmlFor="tech-search">Search technologies</Label>
              <Input
                id="tech-search"
                placeholder="Filter technologies..."
                value={techSearch}
                onChange={(event) => setTechSearch(event.target.value)}
              />
            </div>
            {technologies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No technologies yet. Add them in Skills & Technologies.
              </p>
            ) : filteredTechnologies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTechnologies.map((tech) => {
                  const checked = form.technologyIds.includes(tech.id)
                  return (
                    <label
                      key={tech.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const next = value
                            ? [...form.technologyIds, tech.id]
                            : form.technologyIds.filter(
                                (idValue) => idValue !== tech.id,
                              )
                          updateField('technologyIds', next)
                        }}
                      />
                      {tech.name}
                    </label>
                  )
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {form.technologyIds.length} selected
            </p>
          </section>
        </TabsContent>

        <TabsContent value="media">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <FileUploadField
              label="Cover image"
              folder="project-thumbnails"
              value={form.thumbnail_url}
              onUploaded={(url) => updateField('thumbnail_url', url)}
            />
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium">Screenshots</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateField('media', [
                    ...form.media,
                    { key: crypto.randomUUID(), image_url: '', caption: '' },
                  ])
                }
              >
                Add Screenshot
              </Button>
            </div>
            {form.media.map((item, index) => (
              <div key={item.key} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() =>
                      updateField('media', moveItem(form.media, index, -1))
                    }
                    aria-label="Move image up"
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === form.media.length - 1}
                    onClick={() =>
                      updateField('media', moveItem(form.media, index, 1))
                    }
                    aria-label="Move image down"
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <FileUploadField
                  label="Screenshot"
                  folder="project-screenshots"
                  value={item.image_url}
                  onUploaded={(url) => {
                    const next = [...form.media]
                    next[index] = { ...item, image_url: url }
                    updateField('media', next)
                  }}
                />
                <Input
                  placeholder="Image caption"
                  value={item.caption}
                  onChange={(event) => {
                    const next = [...form.media]
                    next[index] = { ...item, caption: event.target.value }
                    updateField('media', next)
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    updateField(
                      'media',
                      form.media.filter((entry) => entry.key !== item.key),
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </section>
        </TabsContent>

        <TabsContent value="publishing">
          <section className="space-y-6 rounded-xl border bg-card p-5">
            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ['github_url', 'GitHub URL'],
                  ['live_url', 'Live Demo URL'],
                  ['docs_url', 'Documentation URL'],
                  ['video_url', 'Video URL'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="url"
                    value={form[key]}
                    onChange={(event) => updateField(key, event.target.value)}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={form.display_order}
                  onChange={(event) =>
                    updateField('display_order', Number(event.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 text-sm">
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(checked) =>
                    updateField('is_published', checked)
                  }
                />
                Draft / Published
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(checked) =>
                    updateField('is_featured', checked)
                  }
                />
                Featured Project
              </label>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
