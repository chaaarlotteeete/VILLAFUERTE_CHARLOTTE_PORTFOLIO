import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { MaterialIcon } from '@/components/public/MaterialIcon'
import { SectionEyebrow } from '@/components/public/SectionEyebrow'
import { parseContentBoolean } from '@/lib/cms-defaults'
import { ADMIN_EMAIL } from '@/lib/constants'
import { socialIconFor } from '@/lib/public-nav'
import { submitContactMessage } from '@/services/contact'
import type { PageSection, SectionContentMap } from '@/services/cms'
import type { ContactSettings } from '@/services/settings'
import type { Profile, SocialLink } from '@/types/database'

interface ContactSectionProps {
  profile: Profile | null
  socialLinks: SocialLink[]
  contactSettings: ContactSettings
  section?: PageSection | null
  content?: SectionContentMap
}

function parseOpportunityOptions(raw?: string) {
  if (!raw?.trim()) {
    return [
      'Full-Time Role',
      'Internship',
      'Freelance / Contract',
      'Collaboration',
      'Other',
    ]
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean)
    }
  } catch {
    /* fall through */
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function ContactSection({
  profile,
  socialLinks,
  contactSettings,
  section,
  content = {},
}: ContactSectionProps) {
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const email =
    contactSettings.support_email || profile?.email || ADMIN_EMAIL
  const linkedin = socialLinks.find((l) =>
    l.platform.toLowerCase().includes('linked'),
  )
  const showForm =
    contactSettings.enable_form &&
    (content.show_form ? parseContentBoolean(content.show_form) : true)
  const formHeading = content.form_heading?.trim() || 'Send an Engineering Inquiry'
  const submitLabel = content.submit_label?.trim() || 'Send Message'
  const errorMessage =
    content.error_message?.trim() || 'Something went wrong. Please try again.'
  const responseTime =
    content.response_time_text?.trim() ||
    'Response Time: Typically within 24 hours'
  const opportunityOptions = parseOpportunityOptions(content.opportunity_options)

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const successMessage =
      contactSettings.success_message ||
      'Thank you! Message dispatched successfully.'

    const role = String(formData.get('role') || '').trim()
    const subjectRaw = String(formData.get('subject') || '').trim()
    const payload = {
      fullName: String(formData.get('full_name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      subject: subjectRaw || role || 'Engineering Inquiry',
      message: String(formData.get('message') || '').trim(),
      honeypot: String(formData.get('company_website') || ''),
    }

    if (payload.honeypot) {
      setFeedback(true)
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
      setFeedback(true)
      toast.success(successMessage)
      form.reset()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : errorMessage
      setFormError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="contact" className="w-full bg-surface py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          <div className="flex flex-col items-start gap-6 lg:col-span-5">
            <SectionEyebrow>
              {section?.eyebrow || 'Initiate Contact • 08'}
            </SectionEyebrow>
            <h2 className="font-display text-3xl font-bold text-on-surface lg:text-4xl">
              {section?.heading || "Let's Build Something Resilient Together."}
            </h2>
            <p className="text-base text-secondary">
              {section?.subtitle ||
                'Whether you have a full-time software engineering opening, an internship opportunity, or a system that needs rigorous analysis, my inbox is open.'}
            </p>

            <div className="flex w-full flex-col gap-4 pt-2">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4 shadow-inner">
                <div className="flex items-center gap-3 overflow-hidden">
                  <MaterialIcon
                    name="mail"
                    className="text-primary-container"
                  />
                  <span className="truncate font-mono text-[13px] text-on-surface">
                    {email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void copyEmail()}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-surface-container-lowest px-3 py-1.5 font-mono text-[11px] text-on-surface shadow-sm transition-colors hover:bg-surface-container-high"
                >
                  <MaterialIcon name="content_copy" className="text-sm" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex flex-col gap-2.5 rounded-xl bg-surface-container-low p-4">
                {profile?.location ? (
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <MaterialIcon
                      name="location_on"
                      className="text-base text-secondary"
                    />
                    <span>{profile.location}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <MaterialIcon
                    name="schedule"
                    className="text-base text-secondary"
                  />
                  <span>{responseTime}</span>
                </div>
                {linkedin ? (
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <MaterialIcon
                      name={socialIconFor(linkedin.platform)}
                      className="text-base text-secondary"
                    />
                    <a
                      href={linkedin.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] text-primary-container no-underline hover:underline"
                    >
                      {linkedin.url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm lg:col-span-7 lg:p-10">
            <h3 className="mb-6 font-display text-xl font-bold text-on-surface">
              {formHeading}
            </h3>

            {showForm ? (
              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="contact-name"
                      className="font-mono text-[11px] text-secondary"
                    >
                      Your Name *
                    </label>
                    <input
                      id="contact-name"
                      name="full_name"
                      required
                      minLength={2}
                      placeholder="e.g. Eleanor Vance"
                      className="rounded-lg bg-surface-container-low px-4 py-2.5 text-sm text-on-surface shadow-inner outline-none focus:ring-2 focus:ring-primary-container"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="contact-email"
                      className="font-mono text-[11px] text-secondary"
                    >
                      Your Work Email *
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      placeholder="eleanor@company.com"
                      className="rounded-lg bg-surface-container-low px-4 py-2.5 text-sm text-on-surface shadow-inner outline-none focus:ring-2 focus:ring-primary-container"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-role"
                    className="font-mono text-[11px] text-secondary"
                  >
                    Engagement Opportunity
                  </label>
                  <select
                    id="contact-role"
                    name="role"
                    className="rounded-lg bg-surface-container-low px-4 py-2.5 text-sm text-on-surface shadow-inner outline-none focus:ring-2 focus:ring-primary-container"
                    defaultValue={opportunityOptions[0]}
                  >
                    {opportunityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-subject"
                    className="font-mono text-[11px] text-secondary"
                  >
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    name="subject"
                    placeholder="Project or Role Details"
                    className="rounded-lg bg-surface-container-low px-4 py-2.5 text-sm text-on-surface shadow-inner outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-message"
                    className="font-mono text-[11px] text-secondary"
                  >
                    Message / Technical Scope *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    minLength={10}
                    rows={4}
                    placeholder="Provide brief context regarding your tech stack, project goals, or candidate profile requirements..."
                    className="resize-none rounded-lg bg-surface-container-low px-4 py-2.5 text-sm text-on-surface shadow-inner outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>

                {formError ? (
                  <p className="text-sm text-error" role="alert">
                    {formError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3 text-sm font-semibold text-on-primary shadow transition-all hover:bg-primary disabled:opacity-70"
                >
                  <MaterialIcon
                    name={submitting ? 'sync' : 'send'}
                    className={
                      submitting ? 'animate-spin text-base' : 'text-base'
                    }
                  />
                  <span>{submitting ? 'Sending...' : submitLabel}</span>
                </button>

                {feedback ? (
                  <div className="rounded-lg bg-secondary-container p-3 text-center font-mono text-[11px] text-on-secondary-fixed">
                    {contactSettings.success_message ||
                      'Thank you! Message dispatched successfully. Response typically within 24 hours.'}
                  </div>
                ) : null}
              </form>
            ) : (
              <p className="text-sm text-on-surface-variant">
                The contact form is currently disabled. Reach out via email or
                social links instead.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
