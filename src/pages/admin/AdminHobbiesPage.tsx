import { Eye, Pencil } from 'lucide-react'
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
import {
  deleteHobby,
  fetchAdminHobbies,
  updateHobbyFlags,
} from '@/services/adminHobbies'
import type { Hobby } from '@/types/database'
import { formatDate } from '@/utils/date'

type SortKey = 'updated_desc' | 'name_asc' | 'order_asc'

export function AdminHobbiesPage() {
  const { data, error, loading, reload } = useAsyncData(fetchAdminHobbies)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sort, setSort] = useState<SortKey>('order_asc')
  const [viewing, setViewing] = useState<Hobby | null>(null)

  const hobbies = useMemo(() => {
    let list = [...(data ?? [])]
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
    return list
  }, [data, search, categoryFilter, sort])

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
            {HOBBY_CATEGORIES.map((category) => (
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
                <div className="flex gap-3">
                  {hobby.cover_image_url ? (
                    <img
                      src={hobby.cover_image_url}
                      alt=""
                      className="size-16 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex size-16 items-center justify-center rounded-md border bg-muted text-xs">
                      {hobby.icon || 'N/A'}
                    </div>
                  )}
                  <div>
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
