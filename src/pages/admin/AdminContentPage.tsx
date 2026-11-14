import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  Briefcase,
  Code2,
  FolderKanban,
  Heart,
  Layout,
  Mail,
  Paintbrush,
  Sparkles,
  UserRound,
} from 'lucide-react'

import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'

const sections = [
  {
    title: 'Home / Hero',
    description: 'Headline, CTAs, availability badge, and hero chrome.',
    href: '/admin/content/hero',
    icon: Sparkles,
  },
  {
    title: 'About Me',
    description: 'Section chrome, about card, vitals, and specialization cards.',
    href: '/admin/content/about',
    icon: UserRound,
  },
  {
    title: 'Skills',
    description: 'Skills section eyebrow, heading, and subtitle.',
    href: '/admin/content/skills',
    icon: Code2,
  },
  {
    title: 'Featured Projects',
    description: 'Featured section copy. Project records stay under Projects.',
    href: '/admin/content/featured_projects',
    icon: FolderKanban,
  },
  {
    title: 'All Projects',
    description: 'Archive section eyebrow, heading, and subtitle.',
    href: '/admin/content/projects',
    icon: FolderKanban,
  },
  {
    title: 'Experience & Education',
    description: 'Timeline section chrome and column headings via experience editor.',
    href: '/admin/content/experience',
    icon: Briefcase,
  },
  {
    title: 'Hobbies',
    description: 'Hobbies section eyebrow, heading, and subtitle.',
    href: '/admin/content/hobbies',
    icon: Heart,
  },
  {
    title: 'Certifications',
    description: 'Certifications section eyebrow, heading, and subtitle.',
    href: '/admin/content/certifications',
    icon: Award,
  },
  {
    title: 'Contact',
    description: 'Contact copy, form labels, and opportunity types.',
    href: '/admin/content/contact',
    icon: Mail,
  },
  {
    title: 'Homepage sections',
    description: 'Show or hide major homepage sections and featured limits.',
    href: '/admin/settings/homepage',
    icon: Layout,
  },
]

const appearance = [
  { title: 'Header & navigation', href: '/admin/appearance/header' },
  { title: 'Footer', href: '/admin/appearance/footer' },
  { title: 'Floating actions', href: '/admin/appearance/floating-actions' },
]

export function AdminContentPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Website Content"
        description="Edit published copy for public sections, layout chrome, and navigation-related content."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((item) => {
          const Icon = item.icon
          return (
            <article
              key={item.href}
              className="flex flex-col gap-3 rounded-xl border bg-card p-5"
            >
              <div className="flex items-center gap-2">
                <Icon className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">{item.title}</h2>
              </div>
              <p className="flex-1 text-sm text-muted-foreground">{item.description}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="w-fit">
                  <Link to={item.href}>
                    Edit Content
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-fit">
                  <a href="/" target="_blank" rel="noreferrer">
                    Preview
                  </a>
                </Button>
              </div>
            </article>
          )
        })}
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2">
          <Paintbrush className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Appearance</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Header, footer, and floating action configuration.
        </p>
        <div className="flex flex-wrap gap-2">
          {appearance.map((item) => (
            <Button key={item.href} asChild variant="secondary">
              <Link to={item.href}>{item.title}</Link>
            </Button>
          ))}
        </div>
      </section>
    </div>
  )
}
