import { ArrowDown, ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { FileUploadField } from '@/components/admin/FileUploadField'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
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
import { HOBBY_CATEGORIES } from '@/lib/constants'
import {
  fetchAdminHobbyById,
  saveAdminHobby,
} from '@/services/adminHobbies'

interface MediaDraft {
  key: string
  image_url: string
  caption: string
}

interface FormState {
  name: string
  category: string
  short_description: string
  detailed_description: string
  icon: string
  cover_image_url: string
  is_visible: boolean
  display_order: number
  media: MediaDraft[]
}

function emptyForm(): FormState {
  return {
    name: '',
    category: HOBBY_CATEGORIES[0],
    short_description: '',
    detailed_description: '',
    icon: '',
    cover_image_url: '',
    is_visible: true,
    display_order: 0,
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

export function AdminHobbyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    let active = true

    async function load() {
      if (!id) {
        setLoading(false)
        return
      }
      try {
        const hobby = await fetchAdminHobbyById(id)
        if (!active) return
        if (!hobby) {
          setError('Hobby not found')
          setLoading(false)
          return
        }
        setForm({
          name: hobby.name,
          category: hobby.category,
          short_description: hobby.short_description ?? '',
          detailed_description: hobby.detailed_description ?? '',
          icon: hobby.icon ?? '',
          cover_image_url: hobby.cover_image_url ?? '',
          is_visible: hobby.is_visible,
          display_order: hobby.display_order,
          media: hobby.hobby_media.map((item) => ({
            key: item.id,
            image_url: item.image_url,
            caption: item.caption ?? '',
          })),
        })
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load hobby')
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

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validate() {
    if (!form.name.trim()) {
      toast.error('Hobby name is required')
      return false
    }
    if (!form.category.trim()) {
      toast.error('Category is required')
      return false
    }
    return true
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const saved = await saveAdminHobby({
        hobby: {
          ...(id ? { id } : {}),
          name: form.name.trim(),
          category: form.category,
          short_description: form.short_description.trim() || null,
          detailed_description: form.detailed_description.trim() || null,
          icon: form.icon.trim() || null,
          cover_image_url: form.cover_image_url || null,
          is_visible: form.is_visible,
          display_order: Number(form.display_order) || 0,
        },
        media: form.media
          .filter((item) => item.image_url.trim())
          .map((item, index) => ({
            image_url: item.image_url.trim(),
            caption: item.caption.trim() || null,
            display_order: index,
          })),
      })
      toast.success(isEdit ? 'Hobby updated' : 'Hobby saved')
      navigate(`/admin/hobbies/${saved.id}/edit`, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function handlePreview() {
    if (!validate()) return
    toast.message('Preview', {
      description: `${form.name} · ${form.category} · ${
        form.is_visible ? 'Visible' : 'Hidden'
      }`,
    })
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Hobby' : 'Add Hobby'}
        description="Basic information, media gallery, and display settings."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/hobbies">Cancel</Link>
            </Button>
            <Button type="button" variant="secondary" onClick={handlePreview}>
              Preview
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Saving...' : 'Save Hobby'}
            </Button>
          </div>
        }
      />

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hobby-name">Hobby Name</Label>
            <Input
              id="hobby-name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(value) => updateField('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOBBY_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="detailed_description">Detailed Description</Label>
            <Textarea
              id="detailed_description"
              className="min-h-[140px]"
              value={form.detailed_description}
              onChange={(event) =>
                updateField('detailed_description', event.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Input
              id="icon"
              placeholder="Icon name or emoji"
              value={form.icon}
              onChange={(event) => updateField('icon', event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Media</h2>
        <FileUploadField
          label="Cover Image"
          folder="hobby-covers"
          value={form.cover_image_url}
          onUploaded={(url) => updateField('cover_image_url', url)}
        />
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium">Gallery Images</h3>
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
            Add Image
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
              label="Gallery image"
              folder="hobby-gallery"
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
              Remove Image
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Display Settings</h2>
        <label className="flex items-center gap-3 text-sm">
          <Switch
            checked={form.is_visible}
            onCheckedChange={(checked) => updateField('is_visible', checked)}
          />
          Visibility Toggle
        </label>
        <div className="max-w-xs space-y-2">
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
      </section>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Saving...' : 'Save Hobby'}
        </Button>
        <Button type="button" variant="secondary" onClick={handlePreview}>
          Preview
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/hobbies">Cancel</Link>
        </Button>
      </div>
    </div>
  )
}
