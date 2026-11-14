import { useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAsyncData } from '@/hooks/useAsyncData'
import {
  deleteEducation,
  fetchAdminEducation,
  saveEducation,
} from '@/services/adminContent'
import { formatDateRange } from '@/utils/date'

const empty = {
  degree: '',
  institution: '',
  specialization: '',
  start_date: '',
  end_date: '',
  is_current: false,
  description: '',
}

export function AdminEducationPage() {
  const { data, error, loading, reload } = useAsyncData(fetchAdminEducation)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const items = data ?? []

  function reset() {
    setForm(empty)
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Education"
        description="Manage educational institutions, degrees, and specializations."
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(empty)
              setShowForm(true)
            }}
          >
            Add Education
          </Button>
        }
      />

      {showForm || editingId ? (
        <form
          className="space-y-4 rounded-xl border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault()
            void (async () => {
              if (!form.degree.trim() || !form.institution.trim()) {
                toast.error('Degree and institution are required')
                return
              }
              try {
                await saveEducation({
                  id: editingId ?? undefined,
                  degree: form.degree.trim(),
                  institution: form.institution.trim(),
                  specialization: form.specialization.trim() || null,
                  start_date: form.start_date || null,
                  end_date: form.is_current ? null : form.end_date || null,
                  is_current: form.is_current,
                  description: form.description || null,
                  display_order: editingId
                    ? items.find((item) => item.id === editingId)?.display_order ??
                      items.length
                    : items.length,
                })
                toast.success(editingId ? 'Education updated' : 'Education added')
                reset()
                reload()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Save failed')
              }
            })()
          }}
        >
          <h2 className="text-lg font-semibold">
            {editingId ? 'Edit Education' : 'Add Education'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input
                required
                value={form.institution}
                onChange={(e) =>
                  setForm({ ...form, institution: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Degree</Label>
              <Input
                required
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Specialization</Label>
              <Input
                value={form.specialization}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                disabled={form.is_current}
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
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
                  end_date: checked ? '' : form.end_date,
                })
              }
            />
            Currently studying
          </label>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">{editingId ? 'Update' : 'Save Education'}</Button>
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title="No education entries yet" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.degree}</h3>
                    {item.is_current ? <Badge>Current</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.institution}</p>
                  {item.specialization ? (
                    <p className="text-sm text-muted-foreground">
                      {item.specialization}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatDateRange(item.start_date, item.end_date, item.is_current)}
                  </p>
                  {item.description ? (
                    <p className="mt-2 text-sm">{item.description}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(item.id)
                      setShowForm(true)
                      setForm({
                        degree: item.degree,
                        institution: item.institution,
                        specialization: item.specialization ?? '',
                        start_date: item.start_date ?? '',
                        end_date: item.end_date ?? '',
                        is_current: item.is_current,
                        description: item.description ?? '',
                      })
                    }}
                  >
                    Edit
                  </Button>
                  <ConfirmDeleteButton
                    onConfirm={async () => {
                      await deleteEducation(item.id)
                      toast.success('Deleted')
                      reload()
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
