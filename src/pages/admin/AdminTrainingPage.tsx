import { useCallback, useEffect, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { FileUploadField } from '@/components/admin/FileUploadField'
import { MonthYearPicker } from '@/components/admin/MonthYearPicker'
import { ReorderControls } from '@/components/admin/ReorderControls'
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
import {
  deleteTraining,
  fetchAdminTraining,
  reorderTraining,
  saveTraining,
} from '@/services/adminTraining'
import type { TrainingRecord, TrainingType } from '@/types/database'
import { formatDateRange, fromMonthValue, toMonthValue } from '@/utils/date'

const TRAINING_TYPES: TrainingType[] = [
  'TESDA Training',
  'Short Course',
  'Bootcamp',
  'Workshop',
  'Seminar',
  'Professional Development',
  'Other',
]

const empty = {
  title: '',
  provider: '',
  training_type: 'TESDA Training' as TrainingType,
  qualification_code: '',
  description: '',
  location: '',
  start_date: '',
  completion_date: '',
  expected_completion: '',
  is_current: false,
  training_hours: '',
  document_url: '',
  is_visible: true,
  display_order: '',
}

function compareMonths(a: string, b: string) {
  const am = toMonthValue(a)
  const bm = toMonthValue(b)
  if (!am || !bm) return 0
  return am.localeCompare(bm)
}

export function AdminTrainingPage() {
  const { data, error, loading, reload } = useAsyncData(fetchAdminTraining)
  const [orderedItems, setOrderedItems] = useState<TrainingRecord[]>([])
  const [savingOrder, setSavingOrder] = useState(false)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (data) {
      setOrderedItems(
        [...data].sort((a, b) => a.display_order - b.display_order),
      )
    }
  }, [data])

  const persistOrder = useCallback(
    async (next: TrainingRecord[], previous: TrainingRecord[]) => {
      setSavingOrder(true)
      setOrderedItems(next)
      try {
        await reorderTraining(next.map((item) => item.id))
        toast.success('Order updated')
        reload()
      } catch (err) {
        setOrderedItems(previous)
        toast.error(err instanceof Error ? err.message : 'Failed to save order')
      } finally {
        setSavingOrder(false)
      }
    },
    [reload],
  )

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const items = orderedItems

  function reset() {
    setForm(empty)
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(item: TrainingRecord) {
    setEditingId(item.id)
    setShowForm(true)
    setForm({
      title: item.title,
      provider: item.provider,
      training_type: item.training_type,
      qualification_code: item.qualification_code ?? '',
      description: item.description ?? '',
      location: item.location ?? '',
      start_date: toMonthValue(item.start_date),
      completion_date: toMonthValue(item.completion_date),
      expected_completion: toMonthValue(item.expected_completion),
      is_current: item.is_current,
      training_hours:
        item.training_hours != null ? String(item.training_hours) : '',
      document_url: item.document_url ?? '',
      is_visible: item.is_visible !== false,
      display_order: String(item.display_order),
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Training"
        description="Manage training programs, TESDA courses, and professional development. Drag to reorder."
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm({ ...empty, display_order: String(items.length) })
              setShowForm(true)
            }}
          >
            Add Training
          </Button>
        }
      />

      {showForm ? (
        <form
          className="space-y-4 rounded-xl border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault()
            void (async () => {
              if (!form.title.trim() || !form.provider.trim()) {
                toast.error('Title and provider are required')
                return
              }
              if (
                form.start_date &&
                form.completion_date &&
                !form.is_current &&
                compareMonths(form.completion_date, form.start_date) < 0
              ) {
                toast.error('Completion date cannot be before start date')
                return
              }
              const order = form.display_order.trim()
                ? Number(form.display_order)
                : editingId
                  ? (items.find((item) => item.id === editingId)?.display_order ??
                    items.length)
                  : items.length
              try {
                await saveTraining({
                  id: editingId ?? undefined,
                  title: form.title.trim(),
                  provider: form.provider.trim(),
                  training_type: form.training_type,
                  qualification_code: form.qualification_code.trim() || null,
                  description: form.description.trim() || null,
                  location: form.location.trim() || null,
                  start_date: fromMonthValue(form.start_date),
                  completion_date: form.is_current
                    ? null
                    : fromMonthValue(form.completion_date),
                  expected_completion: form.is_current
                    ? fromMonthValue(form.expected_completion)
                    : null,
                  is_current: form.is_current,
                  training_hours: form.training_hours.trim()
                    ? Number(form.training_hours)
                    : null,
                  document_url: form.document_url.trim() || null,
                  is_visible: form.is_visible,
                  display_order: Number.isFinite(order) ? order : items.length,
                })
                toast.success(editingId ? 'Training updated' : 'Training saved')
                reset()
                reload()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Save failed')
              }
            })()
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Training type</Label>
              <Select
                value={form.training_type}
                onValueChange={(value) =>
                  setForm({ ...form, training_type: value as TrainingType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Qualification code</Label>
              <Input
                value={form.qualification_code}
                onChange={(e) =>
                  setForm({ ...form, qualification_code: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Training hours</Label>
              <Input
                type="number"
                min={0}
                value={form.training_hours}
                onChange={(e) =>
                  setForm({ ...form, training_hours: e.target.value })
                }
              />
            </div>
            <MonthYearPicker
              label="Start date"
              value={form.start_date}
              onChange={(value) => setForm({ ...form, start_date: value })}
            />
            {form.is_current ? (
              <MonthYearPicker
                label="Expected completion"
                value={form.expected_completion}
                onChange={(value) =>
                  setForm({ ...form, expected_completion: value })
                }
              />
            ) : (
              <MonthYearPicker
                label="Completion date"
                value={form.completion_date}
                onChange={(value) =>
                  setForm({ ...form, completion_date: value })
                }
              />
            )}
            <div className="space-y-2">
              <Label>Display order</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) =>
                  setForm({ ...form, display_order: e.target.value })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={form.is_current}
              onCheckedChange={(checked) =>
                setForm({
                  ...form,
                  is_current: checked,
                  completion_date: checked ? '' : form.completion_date,
                  expected_completion: checked ? form.expected_completion : '',
                })
              }
            />
            Currently attending
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={form.is_visible}
              onCheckedChange={(checked) =>
                setForm({ ...form, is_visible: checked })
              }
            />
            Visible on public site
          </label>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <FileUploadField
            label="Training document"
            folder="training-docs"
            accept=".pdf,image/jpeg,image/png,image/webp"
            value={form.document_url}
            onUploaded={(url) => setForm({ ...form, document_url: url })}
          />
          <div className="flex gap-2">
            <Button type="submit">{editingId ? 'Update' : 'Save Training'}</Button>
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title="No training records yet" />
      ) : (
        <SortableList
          items={items}
          disabled={savingOrder}
          onReorder={async (reordered) => {
            const withOrder = reordered.map((item, index) => ({
              ...item,
              display_order: index,
            }))
            await persistOrder(withOrder, items)
          }}
          renderItem={(item, handle: SortableHandleProps) => {
            const index = items.findIndex((row) => row.id === item.id)
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
                    disableDown={index >= items.length - 1}
                    onMoveUp={() => {
                      if (index <= 0) return
                      const next = [...items]
                      const [removed] = next.splice(index, 1)
                      next.splice(index - 1, 0, removed)
                      void persistOrder(
                        next.map((row, i) => ({ ...row, display_order: i })),
                        items,
                      )
                    }}
                    onMoveDown={() => {
                      if (index >= items.length - 1) return
                      const next = [...items]
                      const [removed] = next.splice(index, 1)
                      next.splice(index + 1, 0, removed)
                      void persistOrder(
                        next.map((row, i) => ({ ...row, display_order: i })),
                        items,
                      )
                    }}
                  />
                  <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        <Badge variant="outline">{item.training_type}</Badge>
                        {item.is_current ? <Badge>Current</Badge> : null}
                        {item.is_visible === false ? (
                          <Badge variant="secondary">Hidden</Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.provider}
                      </p>
                      {item.qualification_code ? (
                        <p className="text-xs text-muted-foreground">
                          {item.qualification_code}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {formatDateRange(
                          item.start_date,
                          item.is_current
                            ? item.expected_completion
                            : item.completion_date,
                          item.is_current,
                        )}
                      </p>
                      {item.description ? (
                        <p className="mt-2 text-sm">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(item)}
                      >
                        Edit
                      </Button>
                      <ConfirmDeleteButton
                        onConfirm={async () => {
                          await deleteTraining(item.id)
                          toast.success('Deleted')
                          reload()
                        }}
                      />
                    </div>
                  </div>
                </div>
              </SortableItemShell>
            )
          }}
        />
      )}
    </div>
  )
}
