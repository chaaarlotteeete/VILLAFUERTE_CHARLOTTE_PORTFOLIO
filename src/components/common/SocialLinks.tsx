import { Code2, Globe, Link2, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { SocialLink } from '@/types/database'

interface SocialLinksProps {
  links: SocialLink[]
  email?: string | null
}

function iconFor(platform: string) {
  const key = platform.toLowerCase()
  if (key.includes('git')) return Code2
  if (key.includes('linked')) return Link2
  if (key.includes('mail') || key.includes('email')) return Mail
  return Globe
}

export function SocialLinks({ links, email }: SocialLinksProps) {
  if (links.length === 0 && !email) return null

  return (
    <div className="flex flex-wrap gap-2">
      {email ? (
        <Button asChild variant="outline" size="sm">
          <a href={`mailto:${email}`}>
            <Mail />
            Email
          </a>
        </Button>
      ) : null}
      {links.map((link) => {
        const Icon = iconFor(link.platform)
        return (
          <Button key={link.id} asChild variant="outline" size="sm">
            <a href={link.url} target="_blank" rel="noreferrer">
              <Icon />
              {link.platform}
            </a>
          </Button>
        )
      })}
    </div>
  )
}
