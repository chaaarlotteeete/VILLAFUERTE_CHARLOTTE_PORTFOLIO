import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { FileUploadField } from '@/components/admin/FileUploadField'
import { MonthYearPicker } from '@/components/admin/MonthYearPicker'
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
import {
  deleteCertification,
  fetchAdminCertifications,
  saveCertification,
} from '@/services/adminContent'
import { fetchAdminTraining } from '@/services/adminTraining'
import type { Certification, CertificationType } from '@/types/database'
import { formatDate, fromMonthValue, toMonthValue } from '@/utils/date'

const CERTIFICATION_TYPES: CertificationType[] = [
  'National Certificate I (NC I)',
  'National Certificate II (NC II)',
  'National Certificate III (NC III)',
  'National Certificate IV (NC IV)',
  'Certificate of Competency (COC)',
  'Training Certificate',
  'Other',
]

const TRAINING_NONE = '__none__'

const empty = {
  title: '',
  issuer: '',
  issued_at: '',
  expires_at: '',
  credential_url: '',
  image_url: '',
  document_url: '',
  category: '',
  certification_type: '' as CertificationType | '',
  qualification_name: '',
  credential_number: '',
  show_credential_number: false,
  training_record_id: TRAINING_NONE,
  is_visible: true,
}

export function AdminCertificationsPage() {
  const { data, error, loading, reload } = useAsyncData(fetchAdminCertifications)
  const { data: trainingRecords } = useAsyncData(fetchAdminTraining)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const items = data ?? []
  const training = trainingRecords ?? []

  function reset() {
    setForm(empty)
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(item: Certification) {
    setEditingId(item.id)
    setShowForm(true)
    setForm({
      title: item.title,
      issuer: item.issuer,
      issued_at: toMonthValue(item.issued_at),
      expires_at: toMonthValue(item.expires_at),
      credential_url: item.credential_url ?? '',
      image_url: item.image_url ?? '',
      document_url: item.document_url ?? '',
      category: item.category ?? '',
      certification_type: item.certification_type ?? '',
      qualification_name: item.qualification_name ?? '',
      credential_number: item.credential_number ?? '',
      show_credential_number: item.show_credential_number ?? false,
      training_record_id: item.training_record_id ?? TRAINING_NONE,
      is_visible: item.is_visible !== false,
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Certifications"
        description="Manage certification gallery, credentials, and visibility."
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(empty)
              setShowForm(true)
            }}
          >
            Add Certification
          </Button>
        }
      />

      {showForm || editingId ? (
        <form
          className="space-y-4 rounded-xl border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault()
            void (async () => {
              if (!form.title.trim() || !form.issuer.trim()) {
                toast.error('Title and issuing organization are required')
                return
              }
              try {
                await saveCertification({
                  id: editingId ?? undefined,
                  title: form.title.trim(),
                  issuer: form.issuer.trim(),
                  issued_at: fromMonthValue(form.issued_at),
                  expires_at: fromMonthValue(form.expires_at),
                  credential_url: form.credential_url || null,
                  image_url: form.image_url || null,
                  document_url: form.document_url || null,
                  category: form.category || null,
                  certification_type: form.certification_type || null,
                  qualification_name: form.qualification_name.trim() || null,
                  credential_number: form.credential_number.trim() || null,
                  show_credential_number: form.show_credential_number,
                  training_record_id:
                    form.training_record_id === TRAINING_NONE
                      ? null
                      : form.training_record_id,
                  is_visible: form.is_visible,
                  display_order: editingId
                    ? items.find((item) => item.id === editingId)?.display_order ??
                      items.length
                    : items.length,
                })
                toast.success(editingId ? 'Certification updated' : 'Certification added')
                reset()
                reload()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Save failed')
              }
            })()
          }}
        >
          <h2 className="text-lg font-semibold">
            {editingId ? 'Edit Certification' : 'Add Certification'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cert-title">Title</Label>
              <Input
                id="cert-title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-issuer">Issuing organization</Label>
              <Input
                id="cert-issuer"
                required
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Certification type</Label>
              <Select
                value={form.certification_type || undefined}
                onValueChange={(value) =>
                  setForm({ ...form, certification_type: value as CertificationType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-qualification">Qualification name</Label>
              <Input
                id="cert-qualification"
                value={form.qualification_name}
                onChange={(e) =>
                  setForm({ ...form, qualification_name: e.target.value })
                }
              />
            </div>
            <MonthYearPicker
              label="Issue date"
              value={form.issued_at}
              onChange={(value) => setForm({ ...form, issued_at: value })}
            />
            <MonthYearPicker
              label="Expiration date"
              value={form.expires_at}
              onChange={(value) => setForm({ ...form, expires_at: value })}
            />
            <div className="space-y-2">
              <Label htmlFor="cert-category">Category</Label>
              <Input
                id="cert-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-number">Credential number</Label>
              <Input
                id="cert-number"
                value={form.credential_number}
                onChange={(e) =>
                  setForm({ ...form, credential_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Linked training record</Label>
              <Select
                value={form.training_record_id}
                onValueChange={(value) =>
                  setForm({ ...form, training_record_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TRAINING_NONE}>None</SelectItem>
                  {training.map((record) => (
                    <SelectItem key={record.id} value={record.id}>
                      {record.title} — {record.provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cert-url">Credential URL</Label>
              <Input
                id="cert-url"
                type="url"
                value={form.credential_url}
                onChange={(e) =>
                  setForm({ ...form, credential_url: e.target.value })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={form.show_credential_number}
              onCheckedChange={(checked) =>
                setForm({ ...form, show_credential_number: checked })
              }
            />
            Show credential number on public site
          </label>
          <FileUploadField
            label="Certificate image"
            folder="certifications"
            accept="image/*"
            value={form.image_url}
            onUploaded={(url) => setForm({ ...form, image_url: url })}
          />
          <FileUploadField
            label="Certificate document"
            folder="certifications"
            accept=".pdf,image/jpeg,image/png,image/webp"
            value={form.document_url}
            onUploaded={(url) => setForm({ ...form, document_url: url })}
          />
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={form.is_visible}
              onCheckedChange={(checked) =>
                setForm({ ...form, is_visible: checked })
              }
            />
            Visibility
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">{editingId ? 'Update' : 'Save Certification'}</Button>
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="No certifications yet"
          description="Add certifications to build your credentials gallery."
          action={
            <Button type="button" onClick={() => setShowForm(true)}>
              Add Certification
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-muted text-sm text-muted-foreground">
                  No image
                </div>
              )}
              <div className="space-y-3 p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge
                      variant={item.is_visible !== false ? 'success' : 'secondary'}
                    >
                      {item.is_visible !== false ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.issuer}</p>
                  {item.certification_type ? (
                    <p className="text-xs text-muted-foreground">
                      {item.certification_type}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.issued_at, 'MMM yyyy') || 'No date'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.credential_url ? (
                    <Button asChild size="sm" variant="ghost">
                      <a href={item.credential_url} target="_blank" rel="noreferrer">
                        Credential
                      </a>
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                    Edit
                  </Button>
                  <ConfirmDeleteButton
                    title="Delete certification?"
                    description="This permanently removes the certification record."
                    onConfirm={async () => {
                      await deleteCertification(item.id)
                      toast.success('Deleted')
                      reload()
                    }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}