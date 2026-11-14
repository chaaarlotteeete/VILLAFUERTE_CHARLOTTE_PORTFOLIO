import { Code2, ExternalLink, FileText, PlayCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectGallery } from '@/components/projects/ProjectGallery'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAsyncData } from '@/hooks/useAsyncData'
import {
  fetchProjectBySlug,
  fetchRelatedProjects,
  getProjectTechnologies,
} from '@/services/projects'
import { formatDateRange } from '@/utils/date'

async function loadProjectDetail(slug: string) {
  const project = await fetchProjectBySlug(slug)
  if (!project) return null
  const related = await fetchRelatedProjects(project)
  return { project, related }
}

export function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const { data, error, loading, reload } = useAsyncData(
    () => loadProjectDetail(slug),
    [slug],
  )

  if (loading) return <LoadingState rows={5} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data?.project) {
    return (
      <EmptyState
        title="Project not found"
        description="This project is unavailable or not published."
        action={
          <Button asChild variant="outline">
            <Link to="/projects">Back to projects</Link>
          </Button>
        }
      />
    )
  }

  const { project, related } = data
  const technologies = getProjectTechnologies(project)
  const links = [
    { href: project.github_url, label: 'GitHub', icon: Code2 },
    { href: project.live_url, label: 'Live Demo', icon: ExternalLink },
    { href: project.docs_url, label: 'Documentation', icon: FileText },
    { href: project.video_url, label: 'Video Demo', icon: PlayCircle },
  ].filter((item) => Boolean(item.href))

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{project.project_type}</Badge>
          <Badge variant="outline">{project.platform}</Badge>
          <Badge variant="outline">{project.status}</Badge>
          {project.is_featured ? <Badge>Featured</Badge> : null}
        </div>
        <h1 className="text-4xl font-semibold">{project.title}</h1>
        {project.short_description ? (
          <p className="max-w-3xl text-lg text-muted-foreground">
            {project.short_description}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {project.role ? <span>Role: {project.role}</span> : null}
          <span>
            {formatDateRange(project.start_date, project.end_date) ??
              'Timeline unavailable'}
          </span>
        </div>
      </section>

      {project.thumbnail_url ? (
        <img
          src={project.thumbnail_url}
          alt={project.title}
          className="max-h-[420px] w-full rounded-2xl border object-cover shadow-sm"
        />
      ) : null}

      {project.full_description || project.objectives ? (
        <section className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Project Overview</h2>
          {project.full_description ? (
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {project.full_description}
            </p>
          ) : null}
          {project.objectives ? (
            <>
              <Separator />
              <div>
                <h3 className="font-medium">Objectives</h3>
                <p className="mt-2 whitespace-pre-line text-muted-foreground">
                  {project.objectives}
                </p>
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {project.project_features.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Key Features</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {project.project_features.map((feature) => (
              <article
                key={feature.id}
                className="rounded-xl border bg-card p-5 shadow-sm"
              >
                <h3 className="text-lg font-medium">{feature.title}</h3>
                {feature.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                ) : null}
                {feature.image_url ? (
                  <img
                    src={feature.image_url}
                    alt={feature.title}
                    className="mt-4 aspect-video w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {project.project_contributions.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Key Contributions</h2>
          <div className="space-y-3">
            {project.project_contributions.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border bg-card p-5 shadow-sm"
              >
                <h3 className="font-medium">{item.title}</h3>
                {item.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {technologies.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Technologies Used</h2>
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <Badge key={tech.id} variant="secondary">
                {tech.name}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {project.project_media.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Project Gallery</h2>
          <ProjectGallery media={project.project_media} />
        </section>
      ) : null}

      {links.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Project Links</h2>
          <div className="flex flex-wrap gap-2">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <Button key={link.label} asChild variant="outline">
                  <a href={link.href!} target="_blank" rel="noreferrer">
                    <Icon />
                    {link.label}
                  </a>
                </Button>
              )
            })}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Related Projects</h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <ProjectCard key={item.id} project={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
