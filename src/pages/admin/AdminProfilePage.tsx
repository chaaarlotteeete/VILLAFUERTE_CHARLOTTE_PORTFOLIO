import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { Textarea } from '@/components/ui/textarea'
import {
  fetchAdminSocialLinks,
  saveSocialLink,
  upsertProfile,
} from '@/services/adminContent'
import { fetchProfile } from '@/services/profile'
import type { Profile, SocialLink } from '@/types/database'
import { formatDate } from '@/utils/date'

const GENDER_OPTIONS = [
  'Female',
  'Male',
  'Non-binary',
  'Prefer not to say',
  'Other',
] as const

const RELIGION_OPTIONS = [
  'Roman Catholic',
  'Christian',
  'Protestant',
  'Iglesia ni Cristo',
  'Islam',
  'Buddhism',
  'Hinduism',
  'Prefer not to say',
  'Other',
] as const

const CIVIL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Widowed',
  'Separated',
  'Annulled',
  'Prefer not to say',
] as const

const NONE_VALUE = '__none__'

function findLink(links: SocialLink[], platform: string) {
  return links.find(
    (link) => link.platform.toLowerCase() === platform.toLowerCase(),
  )
}

function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function todayDateValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function withCurrentOption(options: readonly string[], current?: string | null) {
  const value = current?.trim()
  if (!value || options.includes(value)) return [...options]
  return [value, ...options]
}

export function AdminProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [github, setGithub] = useState('')
  const [linkedin, setLinkedin] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [nextProfile, nextLinks] = await Promise.all([
        fetchProfile(),
        fetchAdminSocialLinks(),
      ])
      setProfile(nextProfile ?? { full_name: '' })
      setSocialLinks(nextLinks)
      setGithub(findLink(nextLinks, 'GitHub')?.url ?? '')
      setLinkedin(findLink(nextLinks, 'LinkedIn')?.url ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const preview = useMemo(
    () => ({
      name: profile.full_name?.trim() || 'Your Name',
      title: profile.title?.trim() || 'Professional Title',
      intro:
        profile.short_intro?.trim() ||
        profile.career_objective?.trim() ||
        'Short introduction will appear here.',
      location: profile.location?.trim() || '',
      email: profile.email?.trim() || '',
      image: profile.profile_image_url || '',
      birthplace: profile.birthplace?.trim() || '',
      gender: profile.gender?.trim() || '',
      religion: profile.religion?.trim() || '',
      nationality: profile.nationality?.trim() || '',
      civilStatus: profile.civil_status?.trim() || '',
      birthdate: profile.birthdate || '',
    }),
    [profile],
  )

  async function upsertNamedLink(platform: string, url: string, order: number) {
    const existing = findLink(socialLinks, platform)
    if (!url.trim()) return
    await saveSocialLink({
      id: existing?.id,
      platform,
      url: url.trim(),
      is_visible: true,
      display_order: existing?.display_order ?? order,
    })
  }

  async function handleSave() {
    if (!profile.full_name?.trim()) {
      toast.error('Full name is required')
      return
    }
    const birthdate = emptyToNull(profile.birthdate)
    if (birthdate && birthdate > todayDateValue()) {
      toast.error('Birthdate cannot be in the future')
      return
    }
    setSaving(true)
    try {
      const saved = await upsertProfile({
        id: profile.id,
        full_name: profile.full_name.trim(),
        title: emptyToNull(profile.title),
        short_intro: emptyToNull(profile.short_intro),
        bio: emptyToNull(profile.bio),
        career_objective: emptyToNull(profile.career_objective),
        specialization: emptyToNull(profile.specialization),
        technical_interests: emptyToNull(profile.technical_interests),
        profile_image_url: emptyToNull(profile.profile_image_url),
        email: emptyToNull(profile.email),
        location: emptyToNull(profile.location),
        birthdate,
        gender: emptyToNull(profile.gender),
        religion: emptyToNull(profile.religion),
        birthplace: emptyToNull(profile.birthplace),
        nationality: emptyToNull(profile.nationality),
        civil_status: emptyToNull(profile.civil_status),
      })
      await Promise.all([
        upsertNamedLink('GitHub', github, 0),
        upsertNamedLink('LinkedIn', linkedin, 1),
      ])
      setProfile(saved)
      toast.success('Profile saved')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Personal details, professional identity, biography, and social links."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/about" target="_blank" rel="noreferrer">
                Profile preview
              </Link>
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2">
            <h2 className="text-lg font-semibold md:col-span-2">
              Professional identity
            </h2>
            {(
              [
                ['full_name', 'Full Name', true, 'text'],
                ['title', 'Professional Title', false, 'text'],
                ['email', 'Email', false, 'email'],
                ['location', 'Current location', false, 'text'],
              ] as const
            ).map(([key, label, required, type]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type={type}
                  required={required}
                  value={profile[key] ?? ''}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="short_intro">Short Introduction</Label>
              <Textarea
                id="short_intro"
                value={profile.short_intro ?? ''}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    short_intro: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                className="min-h-[140px]"
                value={profile.bio ?? ''}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="career_objective">Career Objective</Label>
              <Textarea
                id="career_objective"
                value={profile.career_objective ?? ''}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    career_objective: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={profile.specialization ?? ''}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    specialization: event.target.value,
                  }))
                }
                placeholder="e.g. Full-Stack & Systems"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technical_interests">Technical interests</Label>
              <Input
                id="technical_interests"
                value={profile.technical_interests ?? ''}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    technical_interests: event.target.value,
                  }))
                }
                placeholder="React, Flutter, Next"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                type="url"
                placeholder="https://github.com/username"
                value={github}
                onChange={(event) => setGithub(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={linkedin}
                onChange={(event) => setLinkedin(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <FileUploadField
                label="Profile Image"
                folder="profile"
                value={profile.profile_image_url}
                onUploaded={(url) =>
                  setProfile((current) => ({
                    ...current,
                    profile_image_url: url,
                  }))
                }
              />
            </div>
          </section>

          <section className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2">
            <h2 className="text-lg font-semibold md:col-span-2">
              Personal information
            </h2>
            <div className="space-y-2">
              <Label htmlFor="birthdate">Birthdate</Label>
              <Input
                id="birthdate"
                type="date"
                max={todayDateValue()}
                value={profile.birthdate ?? ''}
                onChange={(event) => {
                  const next = event.target.value
                  if (next && next > todayDateValue()) {
                    toast.error('Birthdate cannot be in the future')
                    return
                  }
                  setProfile((current) => ({
                    ...current,
                    birthdate: next,
                  }))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={profile.gender?.trim() || NONE_VALUE}
                onValueChange={(value) =>
                  setProfile((current) => ({
                    ...current,
                    gender: value === NONE_VALUE ? null : value,
                  }))
                }
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Not set</SelectItem>
                  {withCurrentOption(GENDER_OPTIONS, profile.gender).map(
                    (option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="religion">Religion</Label>
              <Select
                value={profile.religion?.trim() || NONE_VALUE}
                onValueChange={(value) =>
                  setProfile((current) => ({
                    ...current,
                    religion: value === NONE_VALUE ? null : value,
                  }))
                }
              >
                <SelectTrigger id="religion">
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Not set</SelectItem>
                  {withCurrentOption(RELIGION_OPTIONS, profile.religion).map(
                    (option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="civil_status">Civil status</Label>
              <Select
                value={profile.civil_status?.trim() || NONE_VALUE}
                onValueChange={(value) =>
                  setProfile((current) => ({
                    ...current,
                    civil_status: value === NONE_VALUE ? null : value,
                  }))
                }
              >
                <SelectTrigger id="civil_status">
                  <SelectValue placeholder="Select civil status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Not set</SelectItem>
                  {withCurrentOption(
                    CIVIL_STATUS_OPTIONS,
                    profile.civil_status,
                  ).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthplace">Birthplace</Label>
              <Input
                id="birthplace"
                value={profile.birthplace ?? ''}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    birthplace: event.target.value,
                  }))
                }
                placeholder="City / Province"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={profile.nationality ?? ''}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    nationality: event.target.value,
                  }))
                }
                placeholder="e.g. Filipino"
              />
            </div>
          </section>
        </div>

        <aside className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Profile preview</h2>
          <div className="mt-4 overflow-hidden rounded-xl border bg-muted/40">
            {preview.image ? (
              <img
                src={preview.image}
                alt={preview.name}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
                Profile image
              </div>
            )}
            <div className="space-y-2 p-4">
              <p className="font-display text-xl font-semibold">{preview.name}</p>
              <p className="text-sm text-muted-foreground">{preview.title}</p>
              <p className="text-sm leading-relaxed">{preview.intro}</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                {preview.email ? <p>{preview.email}</p> : null}
                {preview.location ? <p>{preview.location}</p> : null}
                {preview.birthdate ? (
                  <p>
                    Born{' '}
                    {formatDate(preview.birthdate, 'MMM d, yyyy') ||
                      preview.birthdate}
                  </p>
                ) : null}
                {preview.birthplace ? <p>{preview.birthplace}</p> : null}
                {preview.gender ? <p>{preview.gender}</p> : null}
                {preview.religion ? <p>{preview.religion}</p> : null}
                {preview.nationality ? <p>{preview.nationality}</p> : null}
                {preview.civilStatus ? <p>{preview.civilStatus}</p> : null}
                {github ? <p>GitHub linked</p> : null}
                {linkedin ? <p>LinkedIn linked</p> : null}
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Browser tab title is edited under{' '}
            <Link to="/admin/settings" className="text-primary underline">
              Site Settings
            </Link>
            .
          </p>
          <Button asChild className="mt-4 w-full" variant="outline">
            <Link to="/" target="_blank" rel="noreferrer">
              Open public homepage
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  )
}
