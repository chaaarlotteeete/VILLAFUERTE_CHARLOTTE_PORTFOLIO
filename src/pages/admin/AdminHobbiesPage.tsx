import { Eye, GripVertical, Pencil } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { arrayMove } from '@dnd-kit/sortable'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { ReorderControls } from '@/components/admin/ReorderControls'
import {
  SortableItemShell,
  SortableList,
} from '@/components/admin/SortableList'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAsyncData } from '@/hooks/useAsyncData'
import { HOBBY_CATEGORIES } from '@/lib/constants'
import { fetchHobbyCategories } from '@/services/catalogs'
import {
  deleteHobby,
  fetchAdminHobbies,
  reorderHobbies,
  updateHobbyFlags,
} from '@/services/adminHobbies'
import type { Hobby, HobbyCategory } from '@/types/database'
import { formatDate } from '@/utils/date'

type SortKey = 'updated_desc' | 'name_asc' | 'order_asc'

export function AdminHobbiesPage() {
  const { data, error, loading, reload } = useAsyncData(fetchAdminHobbies)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sort, setSort] = useState<SortKey>('order_asc')
  const [viewing, setViewing] = useState<Hobby | null>(null)
  const [dbCategories, setDbCategories] = useState<HobbyCategory[]>([])
  const [orderedHobbies, setOrderedHobbies] = useState<Hobby[]>([])
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    let active = true
    void fetchHobbyCategories()
      .then((rows) => {
        if (active) setDbCategories(rows)
      })
      .catch(() => {
        /* fallback to hobby-derived categories */
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!data) return
    setOrderedHobbies(
      [...data].sort((a, b) => a.display_order - b.display_order),
    )
  }, [data])

  const categoryOptions = useMemo(() => {
    if (dbCategories.length > 0) {
      return dbCategories.map((cat) => cat.name)
    }
    const fromHobbies = [...new Set((data ?? []).map((h) => h.category))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
    if (fromHobbies.length > 0) return fromHobbies
    return [...HOBBY_CATEGORIES]
  }, [dbCategories, data])

  const hobbies = useMemo(() => {
    const source =
      sort === 'order_asc' && categoryFilter === 'all' && !search.trim()
        ? orderedHobbies
        : [...(data ?? [])]

    let list = [...source]
    const query = search.trim().toLowerCase()
    if (query) {
      list = list.filter((hobby) =>
        [hobby.name, hobby.category, hobby.short_description]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query)),
      )
    }
    if (categoryFilter !== 'all') {
      list = list.filter((hobby) => hobby.category === categoryFilter)
    }
    if (
      sort !== 'order_asc' ||
      categoryFilter !== 'all' ||
      search.trim()
    ) {
      list.sort((a, b) => {
        switch (sort) {
          case 'name_asc':
            return a.name.localeCompare(b.name)
          case 'updated_desc':
            return b.updated_at.localeCompare(a.updated_at)
          case 'order_asc':
          default:
            return a.display_order - b.display_order
        }
      })
    }
    return list
  }, [data, orderedHobbies, search, categoryFilter, sort])

  const canDragReorder =
    sort === 'order_asc' && categoryFilter === 'all' && !search.trim()

  async function applyReorder(next: Hobby[]) {
    const previous = orderedHobbies
    setOrderedHobbies(next)
    setReordering(true)
    try {
      await reorderHobbies(next.map((hobby) => hobby.id))
      toast.success('Order updated')
    } catch (err) {
      setOrderedHobbies(previous)
      toast.error(err instanceof Error ? err.message : 'Failed to update order')
      reload()
    } finally {
      setReordering(false)
    }
  }

  async function toggleVisibility(hobby: Hobby) {
    try {
      await updateHobbyFlags(hobby.id, { is_visible: !hobby.is_visible })
      toast.success(hobby.is_visible ? 'Hobby hidden' : 'Hobby visible')
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) {
    return (
      <ErrorState
        message={`${error} If hobbies tables are missing, run migration 20260314100005.`}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hobbies & Interests"
        description="Manage hobbies with media galleries and visibility settings."
        actions={
          <Button asChild>
            <Link to="/admin/hobbies/new">Add Hobby</Link>
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          placeholder="Search hobbies..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
        <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order_asc">Display order</SelectItem>
            <SelectItem value="name_asc">Name A–Z</SelectItem>
            <SelectItem value="updated_desc">Last updated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(data ?? []).length === 0 ? (
        <EmptyState
          title="No hobbies yet"
          description="Add your first hobby to showcase interests on the portfolio."
          action={
            <Button asChild>
              <Link to="/admin/hobbies/new">Add Hobby</Link>
            </Button>
          }
        />
      ) : hobbies.length === 0 ? (
        <EmptyState title="No matching hobbies" />
      ) : canDragReorder ? (
        <SortableList
          items={hobbies}
          disabled={reordering}
          onReorder={(items) => void applyReorder(items)}
          renderItem={(hobby, handleProps) => {
            const index = hobbies.findIndex((item) => item.id === hobby.id)
            return (
              <SortableItemShell className="p-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="mt-1 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                    aria-label="Drag to reorder"
                    {...handleProps.attributes}
                    {...handleProps.listeners}
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>
                  <ReorderControls
                    className="shrink-0"
                    disableUp={index <= 0}
                    disableDown={index >= hobbies.length - 1}
                    onMoveUp={() => {
                      if (index <= 0) return
                      void applyReorder(arrayMove(hobbies, index, index - 1))
                    }}
                    onMoveDown={() => {
                      if (index >= hobbies.length - 1) return
                      void applyReorder(arrayMove(hobbies, index, index + 1))
                    }}
                  />
                  <HobbyCardBody hobby={hobby} />
                  <div className="ml-auto shrink-0 self-start">
                    <HobbyActions
                      hobby={hobby}
                      onView={() => setViewing(hobby)}
                      onToggleVisibility={() => void toggleVisibility(hobby)}
                      onDeleted={reload}
                    />
                  </div>
                </div>
              </SortableItemShell>
            )
          }}
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Hobby</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Visibility</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hobbies.map((hobby) => (
                  <tr key={hobby.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {hobby.cover_image_url ? (
                          <img
                            src={hobby.cover_image_url}
                            alt=""
                            className="size-12 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="flex size-12 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                            {hobby.icon || 'N/A'}
                          </div>
                        )}
                        <p className="font-medium">{hobby.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{hobby.category}</td>
                    <td className="px-4 py-3">
                      <Badge variant={hobby.is_visible ? 'success' : 'secondary'}>
                        {hobby.is_visible ? 'Visible' : 'Hidden'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{hobby.display_order}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(hobby.updated_at, 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <HobbyActions
                        hobby={hobby}
                        onView={() => setViewing(hobby)}
                        onToggleVisibility={() => void toggleVisibility(hobby)}
                        onDeleted={reload}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {hobbies.map((hobby) => (
              <div key={hobby.id} className="rounded-xl border bg-card p-4">
                <HobbyCardBody hobby={hobby} />
                <div className="mt-4">
                  <HobbyActions
                    hobby={hobby}
                    onView={() => setViewing(hobby)}
                    onToggleVisibility={() => void toggleVisibility(hobby)}
                    onDeleted={reload}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogTitle>{viewing?.name}</DialogTitle>
          {viewing ? (
            <div className="space-y-3 text-sm">
              {viewing.cover_image_url ? (
                <img
                  src={viewing.cover_image_url}
                  alt=""
                  className="max-h-48 w-full rounded-md border object-cover"
                />
              ) : null}
              <p>
                <span className="text-muted-foreground">Category:</span>{' '}
                {viewing.category}
              </p>
              <p>
                <span className="text-muted-foreground">Visibility:</span>{' '}
                {viewing.is_visible ? 'Visible' : 'Hidden'}
              </p>
              {viewing.short_description ? (
                <p>{viewing.short_description}</p>
              ) : null}
              {viewing.detailed_description ? (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {viewing.detailed_description}
                </p>
              ) : null}
              <Button asChild variant="outline">
                <Link to={`/admin/hobbies/${viewing.id}/edit`}>Edit hobby</Link>
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HobbyCardBody({ hobby }: { hobby: Hobby }) {
  return (
    <div className="flex min-w-0 flex-1 gap-3">
      {hobby.cover_image_url ? (
        <img
          src={hobby.cover_image_url}
          alt=""
          className="size-16 shrink-0 rounded-md border object-cover"
        />
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-md border bg-muted text-xs">
          {hobby.icon || 'N/A'}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-medium">{hobby.name}</p>
        <p className="text-sm text-muted-foreground">{hobby.category}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant={hobby.is_visible ? 'success' : 'secondary'}>
            {hobby.is_visible ? 'Visible' : 'Hidden'}
          </Badge>
          <Badge variant="outline">Order {hobby.display_order}</Badge>
        </div>
      </div>
    </div>
  )
}

function HobbyActions({
  hobby,
  onView,
  onToggleVisibility,
  onDeleted,
}: {
  hobby: Hobby
  onView: () => void
  onToggleVisibility: () => void
  onDeleted: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="ghost" onClick={onView}>
        <Eye />
        View
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link to={`/admin/hobbies/${hobby.id}/edit`}>
          <Pencil />
          Edit
        </Link>
      </Button>
      <Button size="sm" variant="secondary" onClick={onToggleVisibility}>
        {hobby.is_visible ? 'Hide' : 'Show'}
      </Button>
      <ConfirmDeleteButton
        title="Delete hobby?"
        description="This permanently deletes the hobby and its gallery images."
        onConfirm={async () => {
          await deleteHobby(hobby.id)
          toast.success('Hobby deleted')
          onDeleted()
        }}
      />
    </div>
  )
}