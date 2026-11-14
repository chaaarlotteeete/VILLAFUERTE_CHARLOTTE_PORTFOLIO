import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { SocialLinks } from '@/components/common/SocialLinks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAsyncData } from '@/hooks/useAsyncData'
import { ADMIN_EMAIL } from '@/lib/constants'
import { submitContactMessage } from '@/services/contact'
import { fetchProfile } from '@/services/profile'
import { fetchContactSettings } from '@/services/settings'
import { fetchSocialLinks } from '@/services/social'

async function loadContactPage() {
  const [profile, socialLinks, settings] = await Promise.all([
    fetchProfile(),
    fetchSocialLinks(),
    fetchContactSettings(),
  ])
  return { profile, socialLinks, settings }
}

export function ContactPage() {
  const { data, error, loading, reload } = useAsyncData(loadContactPage)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const successMessage =
      data?.settings.success_message ||
      'Thank you. Your message has been sent.'

    const payload = {
      fullName: String(formData.get('full_name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      subject: String(formData.get('subject') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      honeypot: String(formData.get('company_website') || ''),
    }

    if (payload.honeypot) {
      toast.success(successMessage)
      form.reset()
      return
    }

    if (payload.message.length < 10) {
      setFormError('Message must be at least 10 characters.')
      return
    }

    setSubmitting(true)
    try {
      await submitContactMessage(payload)
      toast.success(successMessage)
      form.reset()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to send your message.'
      setFormError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const email = data?.profile?.email || ADMIN_EMAIL
  const socialLinks = data?.socialLinks ?? []
  const formEnabled = data?.settings.enable_form ?? true

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Contact"
        description="Send a message or connect through professional links."
      />

      <div className="space-y-3 rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Email: {email}</p>
        <SocialLinks links={socialLinks} email={email} />
      </div>

      {formEnabled ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
          noValidate
        >
          <input
            type="text"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" required minLength={10} />
          </div>
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      ) : (
        <EmptyState
          title="Contact form is currently disabled"
          description="You can still reach out using the email and social links above."
        />
      )}
    </div>
  )
}
