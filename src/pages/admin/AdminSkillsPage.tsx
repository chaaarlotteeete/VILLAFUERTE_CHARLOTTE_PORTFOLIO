import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useAsyncData } from '@/hooks/useAsyncData'
import { DEFAULT_SKILL_FILTERS } from '@/lib/cms-defaults'
import { SKILL_CATEGORIES } from '@/lib/constants'
import {
  deleteSkill,
  fetchAdminSkills,
  saveSkill,
} from '@/services/adminContent'
import {
  deleteTechnology,
  fetchTechnologies,
  upsertTechnology,
} from '@/services/adminProjects'
import {
  deleteSkillCategory,
  fetchSkillCategories,
  saveSkillCategory,
  type SkillCategory,
} from '@/services/cms'
import type { Skill } from '@/types/database'

const fallbackCategories = [
  ...new Set([
    ...SKILL_CATEGORIES,
    ...DEFAULT_SKILL_FILTERS.filter((item) => item.key !== 'all').map((item) => item.key),
  ]),
]

const emptySkill = {
  name: '',
  category: fallbackCategories[0] as string,
  icon: '',
  is_visible: true,
  display_order: 0,
}

export function AdminSkillsPage() {
  const skillsQuery = useAsyncData(fetchAdminSkills)
  const techQuery = useAsyncData(fetchTechnologies)
  const categoriesQuery = useAsyncData(async () => {
    try {
      return await fetchSkillCategories()
    } catch {
      return [] as SkillCategory[]
    }
  })

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptySkill)
  const [techName, setTechName] = useState('')
  const [techCategory, setTechCategory] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryLabel, setNewCategoryLabel] = useState('')

  const skills = useMemo(() => {
    let list = [...(skillsQuery.data ?? [])]
    const query = search.trim().toLowerCase()
    if (query) {
      list = list.filter((skill) =>
        [skill.name, skill.category, skill.icon]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query)),
      )
    }
    if (categoryFilter !== 'all') {
      list = list.filter((skill) => skill.category === categoryFilter)
    }
    return list
  }, [skillsQuery.data, search, categoryFilter])

  if (skillsQuery.loading || techQuery.loading || categoriesQuery.loading) {
    return <LoadingState rows={4} />
  }
  if (skillsQuery.error) {
    return <ErrorState message={skillsQuery.error} onRetry={skillsQuery.reload} />
  }
  if (techQuery.error) {
    return <ErrorState message={techQuery.error} onRetry={techQuery.reload} />
  }

  const allSkills = skillsQuery.data ?? []
  const technologies = techQuery.data ?? []
  const dbCategories = categoriesQuery.data ?? []
  const categoryOptions =
    dbCategories.length > 0
      ? dbCategories.map((category) => category.name)
      : [
          ...new Set([
            ...fallbackCategories,
            ...allSkills.map((skill) => skill.category),
          ]),
        ]

  async function handleSaveCategory() {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required')
      return
    }
    try {
      await saveSkillCategory({
        name: newCategoryName.trim(),
        label: newCategoryLabel.trim() || newCategoryName.trim(),
        display_order: (dbCategories.length + 1) * 10,
        is_visible: true,
      })
      toast.success('Category added')
      setNewCategoryName('')
      setNewCategoryLabel('')
      categoriesQuery.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category')
    }
  }

  function startEdit(skill: Skill) {
    setEditingId(skill.id)
    setForm({
      name: skill.name,
      category: skill.category,
      icon: skill.icon ?? '',
      is_visible: skill.is_visible ?? true,
      display_order: skill.display_order,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptySkill, display_order: allSkills.length })
  }

  async function handleSaveSkill() {
    if (!form.name.trim()) {
      toast.error('Skill name is required')
      return
    }
    try {
      await saveSkill({
        id: editingId ?? undefined,
        name: form.name.trim(),
        category: form.category,
        icon: form.icon.trim() || null,
        is_visible: form.is_visible,
        display_order: Number(form.display_order) || 0,
      })
      toast.success(editingId ? 'Skill updated' : 'Skill added')
      resetForm()
      skillsQuery.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Skills & Technologies"
        description="Manage skill entries and the master technology list used by projects."
        actions={
          <Button
            type="button"
            onClick={() => {
              resetForm()
              setForm((current) => ({
                ...current,
                display_order: allSkills.length,
              }))
            }}
          >
            Add Skill
          </Button>
        }
      />

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Skill categories</h2>
        <p className="text-sm text-muted-foreground">
          Public skill filters are generated from visible categories that have skills.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Category key / name</Label>
            <Input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Frontend Development"
            />
          </div>
          <div className="space-y-2">
            <Label>Public label</Label>
            <Input
              value={newCategoryLabel}
              onChange={(event) => setNewCategoryLabel(event.target.value)}
              placeholder="Frontend Development"
            />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={() => void handleSaveCategory()}>
              Add category
            </Button>
          </div>
        </div>
        {dbCategories.length > 0 ? (
          <div className="space-y-2">
            {dbCategories.map((category) => (
              <div
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div>
                  <p className="font-medium">{category.label}</p>
                  <p className="text-xs text-muted-foreground">{category.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={category.is_visible}
                      onCheckedChange={(checked) => {
                        void saveSkillCategory({
                          id: category.id,
                          name: category.name,
                          label: category.label,
                          is_visible: checked,
                          display_order: category.display_order,
                        })
                          .then(() => {
                            toast.success('Category updated')
                            categoriesQuery.reload()
                          })
                          .catch((err) =>
                            toast.error(
                              err instanceof Error ? err.message : 'Update failed',
                            ),
                          )
                      }}
                    />
                    Visible
                  </label>
                  <ConfirmDeleteButton
                    label="Delete category"
                    onConfirm={async () => {
                      await deleteSkillCategory(category.id)
                      toast.success('Category deleted')
                      categoriesQuery.reload()
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Apply the CMS migration to manage categories in the database. Until then,
            built-in category names are used.
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">
          {editingId ? 'Edit Skill' : 'Add Skill'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(value) => setForm({ ...form, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Skill icon</Label>
            <Input
              placeholder="Icon name or URL"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Display order</Label>
            <Input
              type="number"
              value={form.display_order}
              onChange={(e) =>
                setForm({ ...form, display_order: Number(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <Switch
            checked={form.is_visible}
            onCheckedChange={(checked) =>
              setForm({ ...form, is_visible: checked })
            }
          />
          Visible on public site
        </label>
        <div className="flex gap-2">
          <Button type="button" onClick={() => void handleSaveSkill()}>
            {editingId ? 'Update Skill' : 'Save Skill'}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {skills.length === 0 ? (
          <EmptyState title="No skills found" />
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Skill</th>
                    <th className="px-4 py-3 font-medium">Icon</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Visibility</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((skill) => (
                    <tr key={skill.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{skill.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {skill.icon || '—'}
                      </td>
                      <td className="px-4 py-3">{skill.category}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            skill.is_visible !== false ? 'success' : 'secondary'
                          }
                        >
                          {skill.is_visible !== false ? 'Visible' : 'Hidden'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{skill.display_order}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(skill)}
                          >
                            Edit
                          </Button>
                          <ConfirmDeleteButton
                            onConfirm={async () => {
                              await deleteSkill(skill.id)
                              toast.success('Skill deleted')
                              skillsQuery.reload()
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {skills.map((skill) => (
                <div key={skill.id} className="rounded-xl border bg-card p-4">
                  <p className="font-medium">{skill.name}</p>
                  <p className="text-sm text-muted-foreground">{skill.category}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      variant={
                        skill.is_visible !== false ? 'success' : 'secondary'
                      }
                    >
                      {skill.is_visible !== false ? 'Visible' : 'Hidden'}
                    </Badge>
                    <Badge variant="outline">Order {skill.display_order}</Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(skill)}
                    >
                      Edit
                    </Button>
                    <ConfirmDeleteButton
                      onConfirm={async () => {
                        await deleteSkill(skill.id)
                        toast.success('Skill deleted')
                        skillsQuery.reload()
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Technologies</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input
            placeholder="Technology name"
            value={techName}
            onChange={(e) => setTechName(e.target.value)}
          />
          <Input
            placeholder="Category (optional)"
            value={techCategory}
            onChange={(e) => setTechCategory(e.target.value)}
          />
          <Button
            onClick={() => {
              void (async () => {
                try {
                  await upsertTechnology({
                    name: techName.trim(),
                    category: techCategory.trim() || null,
                    display_order: technologies.length,
                  })
                  setTechName('')
                  setTechCategory('')
                  toast.success('Technology saved')
                  techQuery.reload()
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed')
                }
              })()
            }}
          >
            Add Technology
          </Button>
        </div>
        {technologies.length === 0 ? (
          <EmptyState title="No technologies yet" />
        ) : (
          <div className="space-y-2">
            {technologies.map((tech) => (
              <div
                key={tech.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div>
                  <p className="font-medium">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tech.category || 'Uncategorized'}
                  </p>
                </div>
                <ConfirmDeleteButton
                  onConfirm={async () => {
                    await deleteTechnology(tech.id)
                    toast.success('Technology deleted')
                    techQuery.reload()
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
