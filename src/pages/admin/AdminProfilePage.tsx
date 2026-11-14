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
import { Textarea } from '@/components/ui/textarea'
import {
  fetchAdminSocialLinks,
  saveSocialLink,
  upsertProfile,
} from '@/services/adminContent'
import { fetchProfile } from '@/services/profile'
import type { Profile, SocialLink } from '@/types/database'

function findLink(links: SocialLink[], platform: string) {
  return links.find(
    (link) => link.platform.toLowerCase() === platform.toLowerCase(),
  )
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
    setSaving(true)
    try {
      const saved = await upsertProfile({
        id: profile.id,
        full_name: profile.full_name.trim(),
        title: profile.title || null,
        short_intro: profile.short_intro || null,
        bio: profile.bio || null,
        career_objective: profile.career_objective || null,
        specialization: profile.specialization || null,
        technical_interests: profile.technical_interests || null,
        profile_image_url: profile.profile_image_url || null,
        email: profile.email || null,
        location: profile.location || null,
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
        description="Editable portfolio identity, biography, and social presence."
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
        <div className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2">
          {(
            [
              ['full_name', 'Full Name', true],
              ['title', 'Professional Title', false],
              ['email', 'Email', false],
              ['location', 'Location (optional)', false],
            ] as const
          ).map(([key, label, required]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
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
                {github ? <p>GitHub linked</p> : null}
                {linkedin ? <p>LinkedIn linked</p> : null}
              </div>
            </div>
          </div>
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
