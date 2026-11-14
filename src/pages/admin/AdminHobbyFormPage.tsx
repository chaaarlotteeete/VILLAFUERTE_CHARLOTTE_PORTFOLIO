import { GripVertical } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { arrayMove } from '@dnd-kit/sortable'

import { FileUploadField } from '@/components/admin/FileUploadField'
import { ReorderControls } from '@/components/admin/ReorderControls'
import { SearchableCombobox } from '@/components/admin/SearchableCombobox'
import {
  SortableItemShell,
  SortableList,
} from '@/components/admin/SortableList'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  createHobbyCategory,
  createHobbyOption,
  fetchHobbyCategories,
  fetchHobbyOptions,
} from '@/services/catalogs'
import {
  fetchAdminHobbyById,
  saveAdminHobby,
} from '@/services/adminHobbies'
import type { HobbyCategory } from '@/types/database'

const OTHER_ID = '__other__'
const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp'

interface MediaDraft {
  key: string
  image_url: string
  caption: string
  alt_text: string
}

interface FormState {
  categoryId: string | null
  customCategory: string
  category: string
  optionId: string | null
  customName: string
  name: string
  hobby_category_id: string | null
  hobby_option_id: string | null
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
    categoryId: null,
    customCategory: '',
    category: '',
    optionId: null,
    customName: '',
    name: '',
    hobby_category_id: null,
    hobby_option_id: null,
    short_description: '',
    detailed_description: '',
    icon: '',
    cover_image_url: '',
    is_visible: true,
    display_order: 0,
    media: [],
  }
}

export function AdminHobbyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [categories, setCategories] = useState<HobbyCategory[]>([])
  const [hobbyOptions, setHobbyOptions] = useState<
    Array<{ id: string; name: string }>
  >([])

  const categoryComboboxOptions = useMemo(
    () => categories.map((cat) => ({ id: cat.id, label: cat.name })),
    [categories],
  )

  const optionComboboxOptions = useMemo(
    () => hobbyOptions.map((opt) => ({ id: opt.id, label: opt.name })),
    [hobbyOptions],
  )

  useEffect(() => {
    let active = true

    async function loadCategories() {
      try {
        const rows = await fetchHobbyCategories()
        if (active) setCategories(rows)
      } catch (err) {
        if (active) {
          toast.error(
            err instanceof Error ? err.message : 'Failed to load categories',
          )
        }
      }
    }

    void loadCategories()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadOptions() {
      if (!form.categoryId || form.categoryId === OTHER_ID) {
        setHobbyOptions([])
        return
      }
      try {
        const rows = await fetchHobbyOptions(form.categoryId)
        if (active) setHobbyOptions(rows)
      } catch (err) {
        if (active) {
          toast.error(
            err instanceof Error ? err.message : 'Failed to load hobby names',
          )
        }
      }
    }

    void loadOptions()
    return () => {
      active = false
    }
  }, [form.categoryId])

  useEffect(() => {
    let active = true

    async function loadHobby() {
      if (!id) {
        setLoading(false)
        return
      }
      try {
        const [hobby, cats] = await Promise.all([
          fetchAdminHobbyById(id),
          fetchHobbyCategories(),
        ])
        if (!active) return
        setCategories(cats)

        if (!hobby) {
          setError('Hobby not found')
          setLoading(false)
          return
        }

        let categoryId: string | null = hobby.hobby_category_id
        let customCategory = ''
        if (!categoryId && hobby.category) {
          const match = cats.find(
            (cat) => cat.name.toLowerCase() === hobby.category.toLowerCase(),
          )
          categoryId = match?.id ?? OTHER_ID
          if (categoryId === OTHER_ID) customCategory = hobby.category
        }

        let options: Array<{ id: string; name: string }> = []
        if (categoryId && categoryId !== OTHER_ID) {
          options = await fetchHobbyOptions(categoryId)
          if (!active) return
          setHobbyOptions(options)
        }

        let optionId: string | null = hobby.hobby_option_id
        let customName = ''
        if (!optionId && hobby.name) {
          const match = options.find(
            (opt) => opt.name.toLowerCase() === hobby.name.toLowerCase(),
          )
          optionId = match?.id ?? OTHER_ID
          if (optionId === OTHER_ID) customName = hobby.name
        }

        setForm({
          categoryId,
          customCategory,
          category: hobby.category,
          optionId,
          customName,
          name: hobby.name,
          hobby_category_id: hobby.hobby_category_id,
          hobby_option_id: hobby.hobby_option_id,
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
            alt_text: item.alt_text ?? '',
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

    void loadHobby()
    return () => {
      active = false
    }
  }, [id])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateMedia(next: MediaDraft[]) {
    updateField('media', next)
  }

  const showCustomCategory = form.categoryId === OTHER_ID
  const showCustomName = form.optionId === OTHER_ID
  const categorySelected =
    Boolean(form.categoryId) &&
    (form.categoryId !== OTHER_ID || form.customCategory.trim())

  function validate() {
    if (!form.categoryId) {
      toast.error('Category is required')
      return false
    }
    if (form.categoryId === OTHER_ID && !form.customCategory.trim()) {
      toast.error('Custom category is required')
      return false
    }
    if (!form.optionId) {
      toast.error('Hobby name is required')
      return false
    }
    if (form.optionId === OTHER_ID && !form.customName.trim()) {
      toast.error('Custom hobby name is required')
      return false
    }
    if (form.optionId !== OTHER_ID && !form.name.trim()) {
      toast.error('Hobby name is required')
      return false
    }
    return true
  }

  async function resolveCategoryAndName() {
    let categoryId = form.categoryId
    let categoryText = form.category

    if (categoryId === OTHER_ID) {
      const custom = form.customCategory.trim()
      const existing = categories.find(
        (cat) => cat.name.toLowerCase() === custom.toLowerCase(),
      )
      if (existing) {
        categoryId = existing.id
        categoryText = existing.name
      } else {
        const created = await createHobbyCategory(custom)
        categoryId = created.id
        categoryText = created.name
        setCategories((current) => [...current, created])
      }
    } else if (categoryId) {
      categoryText =
        categories.find((cat) => cat.id === categoryId)?.name ?? categoryText
    }

    let optionId = form.optionId
    let nameText = form.name

    if (optionId === OTHER_ID) {
      const custom = form.customName.trim()
      const options =
        categoryId && categoryId !== OTHER_ID
          ? await fetchHobbyOptions(categoryId)
          : []
      const existing = options.find(
        (opt) => opt.name.toLowerCase() === custom.toLowerCase(),
      )
      if (existing) {
        optionId = existing.id
        nameText = existing.name
      } else if (categoryId && categoryId !== OTHER_ID) {
        const created = await createHobbyOption(categoryId, custom)
        optionId = created.id
        nameText = created.name
      } else {
        nameText = custom
        optionId = null
      }
    } else if (optionId && optionId !== OTHER_ID) {
      nameText =
        hobbyOptions.find((opt) => opt.id === optionId)?.name ?? nameText
    }

    return {
      categoryId: categoryId === OTHER_ID ? null : categoryId,
      categoryText,
      optionId: optionId === OTHER_ID ? null : optionId,
      nameText,
    }
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const resolved = await resolveCategoryAndName()
      const saved = await saveAdminHobby({
        hobby: {
          ...(id ? { id } : {}),
          name: resolved.nameText.trim(),
          category: resolved.categoryText,
          hobby_category_id: resolved.categoryId,
          hobby_option_id: resolved.optionId,
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
            alt_text: item.alt_text.trim() || null,
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
    const categoryLabel =
      form.categoryId === OTHER_ID
        ? form.customCategory || 'Other'
        : form.category
    const nameLabel =
      form.optionId === OTHER_ID ? form.customName || 'Other' : form.name
    toast.message('Preview', {
      description: `${nameLabel} · ${categoryLabel} · ${
        form.is_visible ? 'Visible' : 'Hidden'
      }`,
    })
  }

  const sortableMedia = useMemo(
    () => form.media.map((item) => ({ ...item, id: item.key })),
    [form.media],
  )

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
          <SearchableCombobox
            label="Category"
            required
            value={form.categoryId}
            options={categoryComboboxOptions}
            placeholder="Select category"
            searchPlaceholder="Search categories..."
            onChange={(value, option) => {
              updateField('categoryId', value)
              updateField('optionId', null)
              updateField('customName', '')
              updateField('name', '')
              if (value === OTHER_ID) {
                updateField('customCategory', '')
                return
              }
              if (option) {
                updateField('category', option.label)
                updateField('customCategory', '')
              }
            }}
          />
          {showCustomCategory ? (
            <div className="space-y-2">
              <Label htmlFor="custom-category">Custom category</Label>
              <Input
                id="custom-category"
                value={form.customCategory}
                onChange={(event) => {
                  updateField('customCategory', event.target.value)
                  updateField('category', event.target.value)
                }}
                required
              />
            </div>
          ) : null}
          <SearchableCombobox
            label="Hobby Name"
            required
            value={form.optionId}
            options={optionComboboxOptions}
            placeholder="Select hobby"
            searchPlaceholder="Search hobbies..."
            disabled={!categorySelected}
            onChange={(value, option) => {
              updateField('optionId', value)
              if (value === OTHER_ID) {
                updateField('customName', '')
                updateField('name', '')
                return
              }
              if (option) {
                updateField('name', option.label)
                updateField('customName', '')
              }
            }}
          />
          {showCustomName ? (
            <div className="space-y-2">
              <Label htmlFor="custom-hobby-name">Custom hobby name</Label>
              <Input
                id="custom-hobby-name"
                value={form.customName}
                onChange={(event) => {
                  updateField('customName', event.target.value)
                  updateField('name', event.target.value)
                }}
                required
              />
            </div>
          ) : null}
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
          accept={IMAGE_ACCEPT}
          value={form.cover_image_url}
          onUploaded={(url) => updateField('cover_image_url', url)}
          onClear={() => updateField('cover_image_url', '')}
        />
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-medium">Gallery Images</h3>
            <FileUploadField
              label="Upload images"
              folder="hobby-gallery"
              accept={IMAGE_ACCEPT}
              multiple
              value={null}
              onUploaded={() => {}}
              onUploadedMany={(urls) => {
                updateMedia([
                  ...form.media,
                  ...urls.map((url) => ({
                    key: crypto.randomUUID(),
                    image_url: url,
                    caption: '',
                    alt_text: '',
                  })),
                ])
              }}
            />
          </div>
          {sortableMedia.length > 0 ? (
            <SortableList
              items={sortableMedia}
              onReorder={(items) => {
                updateMedia(
                  items.map(({ id: _id, ...rest }) => rest),
                )
              }}
              renderItem={(item, handleProps) => {
                const index = sortableMedia.findIndex((m) => m.id === item.id)
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
                        disableDown={index >= sortableMedia.length - 1}
                        onMoveUp={() => {
                          if (index <= 0) return
                          updateMedia(
                            arrayMove(form.media, index, index - 1),
                          )
                        }}
                        onMoveDown={() => {
                          if (index >= form.media.length - 1) return
                          updateMedia(
                            arrayMove(form.media, index, index + 1),
                          )
                        }}
                      />
                      <div className="min-w-0 flex-1 space-y-3">
                        <FileUploadField
                          label="Gallery image"
                          folder="hobby-gallery"
                          accept={IMAGE_ACCEPT}
                          value={item.image_url}
                          onUploaded={(url) => {
                            const next = [...form.media]
                            next[index] = { ...next[index], image_url: url }
                            updateMedia(next)
                          }}
                        />
                        <Input
                          placeholder="Image caption"
                          value={item.caption}
                          onChange={(event) => {
                            const next = [...form.media]
                            next[index] = {
                              ...next[index],
                              caption: event.target.value,
                            }
                            updateMedia(next)
                          }}
                        />
                        <Input
                          placeholder="Alt text"
                          value={item.alt_text}
                          onChange={(event) => {
                            const next = [...form.media]
                            next[index] = {
                              ...next[index],
                              alt_text: event.target.value,
                            }
                            updateMedia(next)
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            updateMedia(
                              form.media.filter((entry) => entry.key !== item.key),
                            )
                          }
                        >
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  </SortableItemShell>
                )
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload one or more images to build the gallery.
            </p>
          )}
        </div>
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