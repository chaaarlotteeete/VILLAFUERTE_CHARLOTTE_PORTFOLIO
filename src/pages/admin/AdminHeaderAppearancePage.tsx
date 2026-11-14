import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { SectionContentFields } from '@/components/admin/SectionContentFields'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/AuthContext'
import { HEADER_FIELD_DEFS } from '@/lib/cms-defaults'
import {
  deleteNavigationItem,
  fetchNavigationItems,
  fetchSectionContentMap,
  saveAndPublishSectionContent,
  saveNavigationItem,
  type NavigationItem,
  type SectionContentMap,
} from '@/services/cms'

const navEmpty = {
  label: '',
  destination: '',
  section_key: '',
  is_visible: true,
}

export function AdminHeaderAppearancePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<SectionContentMap>({})
  const [navItems, setNavItems] = useState<NavigationItem[]>([])
  const [navForm, setNavForm] = useState(navEmpty)
  const [editingNavId, setEditingNavId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [map, items] = await Promise.all([
        fetchSectionContentMap('header'),
        fetchNavigationItems('header'),
      ])
      setValues(map)
      setNavItems(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load header settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handlePublish() {
    setSaving(true)
    try {
      await saveAndPublishSectionContent('header', 'header', values, undefined, user?.id ?? null)
      toast.success('Header appearance published')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setSaving(false)
    }
  }

  async function saveNav() {
    if (!navForm.label.trim() || !navForm.destination.trim()) {
      toast.error('Label and destination are required')
      return
    }
    try {
      await saveNavigationItem({
        id: editingNavId ?? undefined,
        label: navForm.label.trim(),
        destination: navForm.destination.trim(),
        location: 'header',
        section_key: navForm.section_key.trim() || null,
        is_visible: navForm.is_visible,
        display_order: editingNavId
          ? navItems.find((item) => item.id === editingNavId)?.display_order ?? navItems.length
          : navItems.length,
      })
      toast.success(editingNavId ? 'Nav item updated' : 'Nav item added')
      setNavForm(navEmpty)
      setEditingNavId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Header & Navigation"
        description="Header branding overrides, resume control, and primary navigation items."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/content">Back</Link>
            </Button>
            <Button disabled={saving} onClick={() => void handlePublish()}>
              {saving ? 'Publishing...' : 'Publish now'}
            </Button>
          </div>
        }
      />

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Header content</h2>
        <SectionContentFields fields={HEADER_FIELD_DEFS} values={values} onChange={setValues} />
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Navigation items</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={navForm.label}
              onChange={(event) => setNavForm({ ...navForm, label: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Destination</Label>
            <Input
              value={navForm.destination}
              onChange={(event) =>
                setNavForm({ ...navForm, destination: event.target.value })
              }
              placeholder="#about or /projects/slug"
            />
          </div>
          <div className="space-y-2">
            <Label>Section key (optional)</Label>
            <Input
              value={navForm.section_key}
              onChange={(event) =>
                setNavForm({ ...navForm, section_key: event.target.value })
              }
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={navForm.is_visible}
              onCheckedChange={(checked) =>
                setNavForm({ ...navForm, is_visible: checked })
              }
            />
            Visible
          </label>
        </div>
        <Button type="button" onClick={() => void saveNav()}>
          {editingNavId ? 'Update nav item' : 'Add nav item'}
        </Button>

        <div className="space-y-3">
          {navItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  {!item.is_visible ? <Badge variant="secondary">Hidden</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">{item.destination}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingNavId(item.id)
                    setNavForm({
                      label: item.label,
                      destination: item.destination,
                      section_key: item.section_key ?? '',
                      is_visible: item.is_visible,
                    })
                  }}
                >
                  Edit
                </Button>
                <ConfirmDeleteButton
                  onConfirm={async () => {
                    await deleteNavigationItem(item.id)
                    toast.success('Nav item deleted')
                    await load()
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}