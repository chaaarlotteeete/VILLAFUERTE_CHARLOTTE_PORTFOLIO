import { GripVertical } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { FileUploadField } from '@/components/admin/FileUploadField'
import { MonthYearPicker } from '@/components/admin/MonthYearPicker'
import { ReorderControls } from '@/components/admin/ReorderControls'
import { SearchableCombobox } from '@/components/admin/SearchableCombobox'
import {
  SortableItemShell,
  SortableList,
  type SortableHandleProps,
} from '@/components/admin/SortableList'
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
import { Textarea } from '@/components/ui/textarea'
import { useAsyncData } from '@/hooks/useAsyncData'
import { supabase } from '@/lib/supabase'
import {
  createAwardCategory,
  fetchAwardCategories,
} from '@/services/catalogs'
import {
  deleteAward,
  fetchAdminAwards,
  reorderAwards,
  saveAward,
  updateAwardFlags,
} from '@/services/adminAwards'
import {
  fetchAdminEducation,
  fetchAdminExperiences,
} from '@/services/adminContent'
import type { Award, AwardCategory } from '@/types/database'
import { formatDate, fromMonthValue, toMonthValue } from '@/utils/date'

const CATEGORY_OTHER = '__other__'
const RELATION_NONE = '__none__'

interface AwardPageData {
  awards: Award[]
  categories: AwardCategory[]
  education: { id: string; degree: string; institution: string }[]
  experiences: { id: string; title: string; organization: string }[]
  projects: { id: string; title: string }[]
}

async function loadAwardPageData(): Promise<AwardPageData> {
  const [awards, categories, education, experiences, projectsResult] =
    await Promise.all([
      fetchAdminAwards(),
      fetchAwardCategories(),
      fetchAdminEducation(),
      fetchAdminExperiences(),
      supabase.from('projects').select('id,title').order('title'),
    ])

  if (projectsResult.error) {
    throw new Error(projectsResult.error.message)
  }

  return {
    awards,
    categories,
    education: education.map((row) => ({
      id: row.id,
      degree: row.degree,
      institution: row.institution,
    })),
    experiences: experiences.map((row) => ({
      id: row.id,
      title: row.title,
      organization: row.organization,
    })),
    projects: (projectsResult.data ?? []) as { id: string; title: string }[],
  }
}

const emptyForm = {
  title: '',
  categoryValue: null as string | null,
  custom_category: '',
  issuer: '',
  description: '',
  received_at: '',
  education_id: RELATION_NONE,
  experience_id: RELATION_NONE,
  project_id: RELATION_NONE,
  image_url: '',
  credential_url: '',
  is_visible: true,
  display_order: '',
}

function categoryLabel(
  award: Award,
  categories: AwardCategory[],
): string {
  if (award.custom_category) return award.custom_category
  if (award.award_category_id) {
    return (
      categories.find((c) => c.id === award.award_category_id)?.name ?? 'Category'
    )
  }
  return 'Uncategorized'
}

export function AdminAwardsPage() {
  const { data, error, loading, reload } = useAsyncData(loadAwardPageData)
  const [orderedAwards, setOrderedAwards] = useState<Award[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [savingOrder, setSavingOrder] = useState(false)

  useEffect(() => {
    if (data?.awards) {
      setOrderedAwards([...data.awards].sort((a, b) => a.display_order - b.display_order))
    }
  }, [data?.awards])

  const categories = data?.categories ?? []
  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        id: cat.id,
        label: cat.name,
        keywords: cat.slug,
      })),
    [categories],
  )

  const canReorder =
    !search.trim() && categoryFilter === 'all' && !showForm && !editingId

  const filteredAwards = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orderedAwards.filter((award) => {
      if (categoryFilter !== 'all') {
        if (categoryFilter === CATEGORY_OTHER) {
          if (!award.custom_category && award.award_category_id) return false
        } else if (award.award_category_id !== categoryFilter) {
          return false
        }
      }
      if (!query) return true
      const label = categoryLabel(award, categories)
      return [award.title, award.issuer, award.description, label]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    })
  }, [orderedAwards, search, categoryFilter, categories])

  const persistOrder = useCallback(
    async (next: Award[], previous: Award[]) => {
      setSavingOrder(true)
      setOrderedAwards(next)
      try {
        await reorderAwards(next.map((item) => item.id))
        toast.success('Order updated')
        reload()
      } catch (err) {
        setOrderedAwards(previous)
        toast.error(err instanceof Error ? err.message : 'Failed to save order')
      } finally {
        setSavingOrder(false)
      }
    },
    [reload],
  )

  function reset() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(award: Award) {
    setEditingId(award.id)
    setShowForm(true)
    setForm({
      title: award.title,
      categoryValue: award.custom_category
        ? CATEGORY_OTHER
        : award.award_category_id,
      custom_category: award.custom_category ?? '',
      issuer: award.issuer ?? '',
      description: award.description ?? '',
      received_at: toMonthValue(award.received_at),
      education_id: award.education_id ?? RELATION_NONE,
      experience_id: award.experience_id ?? RELATION_NONE,
      project_id: award.project_id ?? RELATION_NONE,
      image_url: award.image_url ?? '',
      credential_url: award.credential_url ?? '',
      is_visible: award.is_visible,
      display_order: String(award.display_order),
    })
  }

  async function toggleVisibility(award: Award) {
    try {
      await updateAwardFlags(award.id, { is_visible: !award.is_visible })
      toast.success(award.is_visible ? 'Award hidden' : 'Award visible')
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const awards = data?.awards ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Awards & Achievements"
        description="Manage honors, recognitions, and achievements with categories and ordering."
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm({ ...emptyForm, display_order: String(awards.length) })
              setShowForm(true)
            }}
          >
            Add Award
          </Button>
        }
      />

      {showForm || editingId ? (
        <form
          className="space-y-4 rounded-xl border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault()
            void (async () => {
              if (!form.title.trim()) {
                toast.error('Title is required')
                return
              }
              if (form.categoryValue === CATEGORY_OTHER && !form.custom_category.trim()) {
                toast.error('Enter a custom category or pick a catalog category')
                return
              }

              let awardCategoryId: string | null =
                form.categoryValue && form.categoryValue !== CATEGORY_OTHER
                  ? form.categoryValue
                  : null
              let customCategory: string | null = null

              if (form.categoryValue === CATEGORY_OTHER && form.custom_category.trim()) {
                try {
                  const created = await createAwardCategory(
                    form.custom_category.trim(),
                  )
                  awardCategoryId = created.id
                } catch {
                  customCategory = form.custom_category.trim()
                }
              }

              const order = form.display_order.trim()
                ? Number(form.display_order)
                : editingId
                  ? (awards.find((a) => a.id === editingId)?.display_order ??
                    awards.length)
                  : awards.length

              try {
                await saveAward({
                  id: editingId ?? undefined,
                  title: form.title.trim(),
                  award_category_id: awardCategoryId,
                  custom_category: customCategory,
                  issuer: form.issuer.trim() || null,
                  description: form.description.trim() || null,
                  received_at: fromMonthValue(form.received_at),
                  education_id:
                    form.education_id === RELATION_NONE ? null : form.education_id,
                  experience_id:
                    form.experience_id === RELATION_NONE ? null : form.experience_id,
                  project_id:
                    form.project_id === RELATION_NONE ? null : form.project_id,
                  image_url: form.image_url || null,
                  credential_url: form.credential_url.trim() || null,
                  is_visible: form.is_visible,
                  display_order: Number.isFinite(order) ? order : awards.length,
                })
                toast.success(editingId ? 'Award updated' : 'Award added')
                reset()
                reload()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Save failed')
              }
            })()
          }}
        >
          <h2 className="text-lg font-semibold">
            {editingId ? 'Edit Award' : 'Add Award'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <SearchableCombobox
              label="Category"
              value={form.categoryValue}
              options={categoryOptions}
              allowOther
              otherLabel="Other (custom)"
              onChange={(value) => setForm({ ...form, categoryValue: value })}
            />
            {form.categoryValue === CATEGORY_OTHER ? (
              <div className="space-y-2 md:col-span-2">
                <Label>Custom category</Label>
                <Input
                  value={form.custom_category}
                  onChange={(e) =>
                    setForm({ ...form, custom_category: e.target.value })
                  }
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Issuer</Label>
              <Input
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
              />
            </div>
            <MonthYearPicker
              label="Date received"
              value={form.received_at}
              onChange={(value) => setForm({ ...form, received_at: value })}
            />
            <div className="space-y-2">
              <Label>Related education</Label>
              <Select
                value={form.education_id}
                onValueChange={(value) =>
                  setForm({ ...form, education_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RELATION_NONE}>None</SelectItem>
                  {(data?.education ?? []).map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.degree} — {row.institution}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Related experience</Label>
              <Select
                value={form.experience_id}
                onValueChange={(value) =>
                  setForm({ ...form, experience_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RELATION_NONE}>None</SelectItem>
                  {(data?.experiences ?? []).map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.title} — {row.organization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Related project</Label>
              <Select
                value={form.project_id}
                onValueChange={(value) => setForm({ ...form, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RELATION_NONE}>None</SelectItem>
                  {(data?.projects ?? []).map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Credential URL</Label>
              <Input
                type="url"
                value={form.credential_url}
                onChange={(e) =>
                  setForm({ ...form, credential_url: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Display order</Label>
              <Input
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) =>
                  setForm({ ...form, display_order: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <FileUploadField
            label="Award image"
            folder="awards"
            accept="image/*"
            value={form.image_url}
            onUploaded={(url) => setForm({ ...form, image_url: url })}
          />
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
            <Button type="submit">{editingId ? 'Update' : 'Save Award'}</Button>
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          placeholder="Search awards..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
            <SelectItem value={CATEGORY_OTHER}>Other / custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {awards.length === 0 ? (
        <EmptyState title="No awards yet" />
      ) : filteredAwards.length === 0 ? (
        <EmptyState title="No matching awards" />
      ) : canReorder ? (
        <SortableList
          items={orderedAwards}
          disabled={savingOrder}
          onReorder={async (reordered) => {
            const previous = orderedAwards
            const withOrder = reordered.map((item, index) => ({
              ...item,
              display_order: index,
            }))
            await persistOrder(withOrder, previous)
          }}
          renderItem={(award, handle: SortableHandleProps) => (
            <AwardRow
              award={award}
              categories={categories}
              handle={handle}
              index={orderedAwards.findIndex((a) => a.id === award.id)}
              total={orderedAwards.length}
              onMove={(direction) => {
                const idx = orderedAwards.findIndex((a) => a.id === award.id)
                if (idx < 0) return
                const nextIdx = direction === 'up' ? idx - 1 : idx + 1
                if (nextIdx < 0 || nextIdx >= orderedAwards.length) return
                const next = [...orderedAwards]
                const [removed] = next.splice(idx, 1)
                next.splice(nextIdx, 0, removed)
                void persistOrder(
                  next.map((item, i) => ({ ...item, display_order: i })),
                  orderedAwards,
                )
              }}
              onEdit={() => startEdit(award)}
              onToggleVisibility={() => void toggleVisibility(award)}
              onDeleted={reload}
            />
          )}
        />
      ) : (
        <div className="space-y-2">
          {filteredAwards.map((award) => (
            <SortableItemShell key={award.id} className="p-4">
              <AwardRowContent
                award={award}
                categories={categories}
                onEdit={() => startEdit(award)}
                onToggleVisibility={() => void toggleVisibility(award)}
                onDeleted={reload}
              />
            </SortableItemShell>
          ))}
        </div>
      )}
    </div>
  )
}

function AwardRow({
  award,
  categories,
  handle,
  index,
  total,
  onMove,
  onEdit,
  onToggleVisibility,
  onDeleted,
}: {
  award: Award
  categories: AwardCategory[]
  handle: SortableHandleProps
  index: number
  total: number
  onMove: (direction: 'up' | 'down') => void
  onEdit: () => void
  onToggleVisibility: () => void
  onDeleted: () => void
}) {
  return (
    <SortableItemShell className="p-4">
      <div className="flex gap-3">
        <button
          type="button"
          className="mt-1 touch-none rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Drag to reorder"
          {...(handle.listeners as object)}
          {...(handle.attributes as object)}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <ReorderControls
          disableUp={index <= 0}
          disableDown={index >= total - 1}
          onMoveUp={() => onMove('up')}
          onMoveDown={() => onMove('down')}
        />
        <div className="min-w-0 flex-1">
          <AwardRowContent
            award={award}
            categories={categories}
            onEdit={onEdit}
            onToggleVisibility={onToggleVisibility}
            onDeleted={onDeleted}
          />
        </div>
      </div>
    </SortableItemShell>
  )
}

function AwardRowContent({
  award,
  categories,
  onEdit,
  onToggleVisibility,
  onDeleted,
}: {
  award: Award
  categories: AwardCategory[]
  onEdit: () => void
  onToggleVisibility: () => void
  onDeleted: () => void
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 gap-3">
        {award.image_url ? (
          <img
            src={award.image_url}
            alt=""
            className="size-14 shrink-0 rounded-md border object-cover"
          />
        ) : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{award.title}</h3>
            <Badge variant="outline">{categoryLabel(award, categories)}</Badge>
            <Badge variant={award.is_visible ? 'success' : 'secondary'}>
              {award.is_visible ? 'Visible' : 'Hidden'}
            </Badge>
          </div>
          {award.issuer ? (
            <p className="text-sm text-muted-foreground">{award.issuer}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {formatDate(award.received_at) ?? 'No date'} · Order {award.display_order}
          </p>
          {award.description ? (
            <p className="mt-1 text-sm line-clamp-2">{award.description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onToggleVisibility}>
          {award.is_visible ? 'Hide' : 'Show'}
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <ConfirmDeleteButton
          onConfirm={async () => {
            await deleteAward(award.id)
            toast.success('Deleted')
            onDeleted()
          }}
        />
      </div>
    </div>
  )
}