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
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { ABOUT_FIELD_DEFS } from '@/lib/cms-defaults'
import { fetchAdminSkills } from '@/services/adminContent'
import {
  deleteSpecializationCard,
  fetchPageSectionByKey,
  fetchSectionContentMap,
  fetchSpecializationCardSkillIds,
  fetchSpecializationCards,
  saveAndPublishSectionContent,
  saveContentDraft,
  saveSpecializationCard,
  type PageSection,
  type SectionContentMap,
  type SpecializationCard,
} from '@/services/cms'
import type { Skill } from '@/types/database'

const emptyCard = {
  title: '',
  description: '',
  icon: 'widgets',
  tone: 'bg-primary-fixed text-primary-container',
  is_visible: true,
  skillIds: [] as string[],
}

export function AdminAboutContentPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<SectionContentMap>({})
  const [pageSection, setPageSection] = useState<Partial<PageSection>>({})
  const [cards, setCards] = useState<SpecializationCard[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [cardForm, setCardForm] = useState(emptyCard)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [showCardForm, setShowCardForm] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [map, section, nextCards, nextSkills] = await Promise.all([
        fetchSectionContentMap('about'),
        fetchPageSectionByKey('about'),
        fetchSpecializationCards(),
        fetchAdminSkills(),
      ])
      setValues(map)
      setPageSection(
        section ?? {
          section_key: 'about',
          eyebrow: '',
          heading: '',
          subtitle: '',
        },
      )
      setCards(nextCards)
      setSkills(nextSkills.filter((skill) => skill.is_visible))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load about content')
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
      await saveAndPublishSectionContent(
        'about',
        'about',
        values,
        {
          section_key: 'about',
          eyebrow: pageSection.eyebrow ?? null,
          heading: pageSection.heading ?? null,
          subtitle: pageSection.subtitle ?? null,
        },
        user?.id ?? null,
      )
      await saveContentDraft({
        entityType: 'specialization_cards',
        entityKey: 'about',
        payload: { cards } as unknown as import('@/types/database').Json,
        createdBy: user?.id ?? null,
      })
      toast.success('About content published')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setSaving(false)
    }
  }

  async function openEditCard(card: SpecializationCard) {
    const skillIds = await fetchSpecializationCardSkillIds(card.id)
    setEditingCardId(card.id)
    setCardForm({
      title: card.title,
      description: card.description,
      icon: card.icon,
      tone: card.tone,
      is_visible: card.is_visible,
      skillIds,
    })
    setShowCardForm(true)
  }

  async function saveCard() {
    if (!cardForm.title.trim()) {
      toast.error('Card title is required')
      return
    }
    try {
      await saveSpecializationCard({
        id: editingCardId ?? undefined,
        title: cardForm.title.trim(),
        description: cardForm.description,
        icon: cardForm.icon.trim() || 'widgets',
        tone: cardForm.tone.trim() || 'bg-primary-fixed text-primary-container',
        is_visible: cardForm.is_visible,
        display_order: editingCardId
          ? cards.find((c) => c.id === editingCardId)?.display_order ?? cards.length
          : cards.length,
        skillIds: cardForm.skillIds,
      })
      toast.success(editingCardId ? 'Card updated' : 'Card created')
      setCardForm(emptyCard)
      setEditingCardId(null)
      setShowCardForm(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    }
  }

  function toggleSkill(skillId: string) {
    setCardForm((current) => ({
      ...current,
      skillIds: current.skillIds.includes(skillId)
        ? current.skillIds.filter((id) => id !== skillId)
        : [...current.skillIds, skillId],
    }))
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <div className="space-y-8">
      <PageHeader
        title="About Content"
        description="About section chrome, card copy, vitals labels, and specialization focus cards."
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
        <h2 className="text-lg font-semibold">Section chrome</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="about_eyebrow">Eyebrow</Label>
            <Input
              id="about_eyebrow"
              value={pageSection.eyebrow ?? ''}
              onChange={(event) =>
                setPageSection((current) => ({ ...current, eyebrow: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="about_heading">Heading</Label>
            <Input
              id="about_heading"
              value={pageSection.heading ?? ''}
              onChange={(event) =>
                setPageSection((current) => ({ ...current, heading: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="about_subtitle">Subtitle</Label>
            <Textarea
              id="about_subtitle"
              value={pageSection.subtitle ?? ''}
              onChange={(event) =>
                setPageSection((current) => ({ ...current, subtitle: event.target.value }))
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">About card & vitals</h2>
        <SectionContentFields fields={ABOUT_FIELD_DEFS} values={values} onChange={setValues} />
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Specialization cards</h2>
            <p className="text-sm text-muted-foreground">
              Focus cards displayed in the About section.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setEditingCardId(null)
              setCardForm(emptyCard)
              setShowCardForm(true)
            }}
          >
            Add card
          </Button>
        </div>

        {showCardForm ? (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={cardForm.title}
                  onChange={(event) =>
                    setCardForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Icon (Material icon name)</Label>
                <Input
                  value={cardForm.icon}
                  onChange={(event) =>
                    setCardForm((current) => ({ ...current, icon: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={cardForm.description}
                  onChange={(event) =>
                    setCardForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Tone CSS classes</Label>
                <Input
                  value={cardForm.tone}
                  onChange={(event) =>
                    setCardForm((current) => ({ ...current, tone: event.target.value }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <Switch
                checked={cardForm.is_visible}
                onCheckedChange={(checked) =>
                  setCardForm((current) => ({ ...current, is_visible: checked }))
                }
              />
              Visible on public site
            </label>
            <div className="space-y-2">
              <Label>Linked skills</Label>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => {
                  const active = cardForm.skillIds.includes(skill.id)
                  return (
                    <Button
                      key={skill.id}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      onClick={() => toggleSkill(skill.id)}
                    >
                      {skill.name}
                    </Button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={() => void saveCard()}>
                {editingCardId ? 'Update card' : 'Save card'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCardForm(false)
                  setEditingCardId(null)
                  setCardForm(emptyCard)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          {cards.map((card) => (
            <div key={card.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{card.title}</h3>
                    {!card.is_visible ? <Badge variant="secondary">Hidden</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void openEditCard(card)}>
                    Edit
                  </Button>
                  <ConfirmDeleteButton
                    onConfirm={async () => {
                      await deleteSpecializationCard(card.id)
                      toast.success('Card deleted')
                      await load()
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}