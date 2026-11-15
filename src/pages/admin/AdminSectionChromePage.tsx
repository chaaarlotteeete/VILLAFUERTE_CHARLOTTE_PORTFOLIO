import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  HOMEPAGE_SECTION_LABELS,
  PAGE_SECTION_DEFAULTS,
  parseContentBoolean,
  serializeContentBoolean,
} from '@/lib/cms-defaults'
import {
  fetchPageSectionByKey,
  fetchSectionContentMap,
  upsertPageSection,
  upsertSectionContentMap,
} from '@/services/cms'

const EDITABLE_KEYS = [
  'skills',
  'featured_projects',
  'projects',
  'experience',
  'hobbies',
  'certifications',
] as const

export function AdminSectionChromePage() {
  const { sectionKey = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eyebrow, setEyebrow] = useState('')
  const [heading, setHeading] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [experienceHeading, setExperienceHeading] = useState(
    'Professional Experience & Leadership',
  )
  const [educationHeading, setEducationHeading] = useState('Education')
  const [highlightsHeading, setHighlightsHeading] = useState('Highlights')
  const [showHobbiesWhenEmpty, setShowHobbiesWhenEmpty] = useState(false)
  const [hobbiesEmptyMessage, setHobbiesEmptyMessage] = useState('')

  const label = HOMEPAGE_SECTION_LABELS[sectionKey] || sectionKey
  const allowed = (EDITABLE_KEYS as readonly string[]).includes(sectionKey)

  async function load() {
    if (!allowed) {
      setError('Unknown or unsupported section key.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const defaults = PAGE_SECTION_DEFAULTS[sectionKey]
      const section = await fetchPageSectionByKey(sectionKey)
      setEyebrow(section?.eyebrow ?? defaults?.eyebrow ?? '')
      setHeading(section?.heading ?? defaults?.heading ?? '')
      setSubtitle(section?.subtitle ?? defaults?.subtitle ?? '')
      if (sectionKey === 'experience') {
        const content = await fetchSectionContentMap('experience')
        setExperienceHeading(
          content.experience_column_heading ||
            'Professional Experience & Leadership',
        )
        setEducationHeading(content.education_column_heading || 'Education')
        setHighlightsHeading(content.highlights_heading || 'Highlights')
      }
      if (sectionKey === 'hobbies') {
        const content = await fetchSectionContentMap('hobbies')
        setShowHobbiesWhenEmpty(parseContentBoolean(content.show_when_empty))
        setHobbiesEmptyMessage(content.empty_state_message || '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load section')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [sectionKey])

  async function handleSave() {
    if (!heading.trim()) {
      toast.error('Heading is required')
      return
    }
    setSaving(true)
    try {
      await upsertPageSection({
        section_key: sectionKey,
        eyebrow: eyebrow.trim() || null,
        heading: heading.trim(),
        subtitle: subtitle.trim() || null,
      })
      if (sectionKey === 'experience') {
        await upsertSectionContentMap('experience', {
          experience_column_heading: experienceHeading.trim(),
          education_column_heading: educationHeading.trim(),
          highlights_heading: highlightsHeading.trim(),
        })
      }
      if (sectionKey === 'hobbies') {
        await upsertSectionContentMap('hobbies', {
          show_when_empty: serializeContentBoolean(showHobbiesWhenEmpty),
          empty_state_message: hobbiesEmptyMessage.trim(),
        })
      }
      toast.success(`${label} section published`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${label} section`}
        description="Edit the public eyebrow, heading, and subtitle for this homepage section."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/content">Back to content</Link>
          </Button>
        }
      />

      <div className="grid max-w-2xl gap-4 rounded-xl border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="eyebrow">Eyebrow</Label>
          <Input
            id="eyebrow"
            value={eyebrow}
            onChange={(event) => setEyebrow(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="heading">Heading</Label>
          <Input
            id="heading"
            value={heading}
            onChange={(event) => setHeading(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Textarea
            id="subtitle"
            rows={4}
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
          />
        </div>
        {sectionKey === 'experience' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="experience-column">Experience column heading</Label>
              <Input
                id="experience-column"
                value={experienceHeading}
                onChange={(event) => setExperienceHeading(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="education-column">Education column heading</Label>
              <Input
                id="education-column"
                value={educationHeading}
                onChange={(event) => setEducationHeading(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="highlights-heading">Highlights heading</Label>
              <Input
                id="highlights-heading"
                value={highlightsHeading}
                onChange={(event) => setHighlightsHeading(event.target.value)}
              />
            </div>
          </>
        ) : null}
        {sectionKey === 'hobbies' ? (
          <>
            <label className="flex items-center gap-3 text-sm">
              <Switch
                checked={showHobbiesWhenEmpty}
                onCheckedChange={setShowHobbiesWhenEmpty}
              />
              Show section when no hobbies are published
            </label>
            <div className="space-y-2">
              <Label htmlFor="hobbies-empty">Empty state message</Label>
              <Textarea
                id="hobbies-empty"
                rows={3}
                value={hobbiesEmptyMessage}
                onChange={(event) => setHobbiesEmptyMessage(event.target.value)}
                placeholder="Optional message when the hobbies list is empty"
              />
            </div>
          </>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Publishing…' : 'Publish'}
          </Button>
          <Button asChild variant="secondary">
            <a href={`/#${sectionKey === 'featured_projects' ? 'featured-projects' : sectionKey}`} target="_blank" rel="noreferrer">
              Preview
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
