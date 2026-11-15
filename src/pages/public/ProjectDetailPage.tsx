import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { MaterialIcon } from '@/components/public/MaterialIcon'
import { ProjectGallery } from '@/components/projects/ProjectGallery'
import { Button } from '@/components/ui/button'
import { useAsyncData } from '@/hooks/useAsyncData'
import { cn } from '@/lib/utils'
import {
  fetchProjectBySlug,
  fetchRelatedProjects,
  getProjectTechnologies,
} from '@/services/projects'
import type { ProjectDetail, ProjectListItem } from '@/types/portfolio'
import type { Technology } from '@/types/database'
import { formatDateRange } from '@/utils/date'
import { parseListItems } from '@/utils/listField'

const FEATURE_ICONS = [
  'auto_awesome',
  'layers',
  'bolt',
  'security',
  'devices',
  'hub',
  'analytics',
  'integration_instructions',
]

async function loadProjectDetail(slug: string) {
  const project = await fetchProjectBySlug(slug)
  if (!project) return null
  const related = await fetchRelatedProjects(project, 2)
  return { project, related }
}

function groupTechnologies(technologies: Technology[]) {
  const groups = new Map<string, Technology[]>()
  for (const tech of technologies) {
    const key = tech.category?.trim() || 'Other'
    const list = groups.get(key) ?? []
    list.push(tech)
    groups.set(key, list)
  }
  return [...groups.entries()]
}

function hostLabel(url: string | null | undefined) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || null
  }
}

function ObjectivesGrid({ text }: { text: string }) {
  const items = parseListItems(text).filter((item) => item.trim())
  const isList =
    items.length > 1 || /^\s*(?:[-*•]|\d+[.)])\s+/.test(text.trim())

  if (!isList) {
    return (
      <p className="font-sans text-base leading-relaxed text-on-surface-variant">
        {text}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((item, index) => (
        <div key={item} className="rounded-lg bg-surface-container-low p-3">
          <p className="font-display text-xl font-semibold text-primary">
            {String(index + 1).padStart(2, '0')}
          </p>
          <p className="font-sans text-sm text-on-surface-variant">{item}</p>
        </div>
      ))}
    </div>
  )
}

function RelatedProjectCard({ project }: { project: ProjectListItem }) {
  const technologies = getProjectTechnologies(project).slice(0, 3)

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest shadow-md transition-all hover:shadow-xl">
      <div className="relative h-48 w-full bg-surface-container">
        {project.thumbnail_url ? (
          <img
            src={project.thumbnail_url}
            alt={project.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-on-surface-variant">
            No preview
          </div>
        )}
        <div className="absolute top-3 right-3 rounded bg-surface-container-lowest/90 px-2.5 py-1 font-mono text-[11px] text-on-surface backdrop-blur">
          {project.project_type}
          {project.platform ? ` · ${project.platform}` : ''}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-6">
        <h3 className="font-display text-xl font-semibold text-on-surface transition-colors group-hover:text-primary">
          {project.title}
        </h3>
        {project.short_description ? (
          <p className="line-clamp-3 font-sans text-sm text-on-surface-variant">
            {project.short_description}
          </p>
        ) : null}
        {technologies.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {technologies.map((tech) => (
              <span
                key={tech.id}
                className="rounded bg-surface-container-low px-2 py-0.5 font-mono text-[11px] text-on-surface-variant"
              >
                {tech.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="px-6 pb-6">
        <Link
          to={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-primary no-underline hover:underline"
        >
          <span>View Case Study</span>
          <MaterialIcon name="arrow_forward" className="text-base" />
        </Link>
      </div>
    </article>
  )
}

function ProjectShowcase({ project }: { project: ProjectDetail }) {
  const previewUrl = project.live_url || project.github_url
  const host = hostLabel(previewUrl)
  const media = project.project_media
  const heroImage = project.thumbnail_url || media[0]?.image_url
  if (!heroImage) return null

  const sideMedia = media.filter((item) => item.image_url !== heroImage).slice(0, 3)

  return (
    <div className="mt-2 overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl">
      <div className="flex items-center justify-between bg-surface-container-high px-4 py-3 text-on-surface-variant">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-error" />
          <div className="h-3 w-3 rounded-full bg-secondary-fixed-dim" />
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="ml-3 truncate font-mono text-[11px]">
            {host
              ? `https://${host}`
              : project.slug
                ? `portfolio/${project.slug}`
                : project.title}
          </span>
        </div>
        <div className="hidden items-center gap-3 font-mono text-[11px] sm:flex">
          {project.live_url ? (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live preview
            </span>
          ) : (
            <span>Project showcase</span>
          )}
          <MaterialIcon name="fullscreen" className="text-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 bg-surface-container-low p-6 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm lg:col-span-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold text-on-surface">
                Primary Interface
              </h3>
              <p className="font-sans text-sm text-on-surface-variant">
                {project.short_description
                  ? 'Representative product surface from the case study.'
                  : `${project.platform} · ${project.project_type}`}
              </p>
            </div>
            <span className="rounded-md bg-primary-fixed px-2.5 py-1 font-mono text-[11px] text-primary">
              {project.status}
            </span>
          </div>
          <div className="relative h-64 overflow-hidden rounded-lg bg-surface-container">
            <img
              src={heroImage}
              alt={`${project.title} showcase`}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-4 shadow-sm lg:col-span-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-xl font-semibold text-on-surface">
                Interface Modules
              </h3>
              <span className="font-mono text-[11px] text-on-surface-variant">
                {media.length > 0
                  ? `${media.length} capture${media.length === 1 ? '' : 's'}`
                  : 'Hero preview'}
              </span>
            </div>

            <div className="mt-2 space-y-2">
              {(sideMedia.length > 0
                ? sideMedia
                : media.length > 0
                  ? media.slice(0, 3)
                  : []
              ).map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low p-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-on-primary">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm leading-tight text-on-surface">
                        {item.caption?.trim() || `Module ${i + 1}`}
                      </p>
                      <p className="font-mono text-[11px] text-on-surface-variant">
                        Gallery asset
                      </p>
                    </div>
                  </div>
                  <img
                    src={item.image_url}
                    alt=""
                    className="h-10 w-14 rounded object-cover"
                    loading="lazy"
                  />
                </div>
              ))}

              {sideMedia.length === 0 && media.length === 0 ? (
                <div className="rounded-lg bg-surface-container-low p-3 font-sans text-sm text-on-surface-variant">
                  Additional gallery captures will appear here when uploaded in
                  admin.
                </div>
              ) : null}
            </div>
          </div>

          <div className="pt-4">
            <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-on-surface-variant">
              <span>Case study coverage</span>
              <span className="font-bold text-on-surface">
                {project.project_features.length} features ·{' '}
                {project.project_contributions.length} contributions
              </span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${Math.min(
                    100,
                    40 +
                      project.project_features.length * 8 +
                      project.project_contributions.length * 6 +
                      media.length * 4,
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const { data, error, loading, reload } = useAsyncData(
    () => loadProjectDetail(slug),
    [slug],
  )

  const technologies = useMemo(
    () => (data?.project ? getProjectTechnologies(data.project) : []),
    [data?.project],
  )
  const techGroups = useMemo(
    () => groupTechnologies(technologies),
    [technologies],
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <LoadingState rows={5} />
      </div>
    )
  }
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }
  if (!data?.project) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <EmptyState
          title="Project not found"
          description="This project is unavailable or not published."
          action={
            <Button asChild variant="outline">
              <Link to="/#projects">Back to projects</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const { project, related } = data
  const dateLabel = formatDateRange(
    project.start_date,
    project.end_date,
    project.status === 'Ongoing',
    project.start_date_precision,
    project.end_date_precision,
  )
  const isLive = Boolean(project.live_url) && project.status !== 'Archived'
  const stampRows = [
    { label: 'Platform', value: project.platform },
    { label: 'Type', value: project.project_type },
    project.role ? { label: 'Role', value: project.role } : null,
    { label: 'Status', value: project.status },
  ].filter(Boolean) as { label: string; value: string }[]

  const contributionMid = Math.ceil(project.project_contributions.length / 2)
  const contributionTracks =
    project.project_contributions.length > 0
      ? [
          {
            key: 'a',
            title: 'Track A: Implementation',
            badge: 'Engineering',
            badgeClass: 'bg-primary-fixed text-primary',
            icon: 'code',
            items: project.project_contributions.slice(0, contributionMid),
          },
          {
            key: 'b',
            title: 'Track B: Analysis & Delivery',
            badge: 'Analysis',
            badgeClass: 'bg-secondary-container text-on-secondary-fixed',
            icon: 'account_tree',
            items: project.project_contributions.slice(contributionMid),
          },
        ].filter((track) => track.items.length > 0)
      : []

  return (
    <div className="flex w-full flex-col">
      {/* Context navigation */}
      <section className="w-full bg-surface-container-low px-6 py-4 shadow-sm lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 font-mono text-[13px] text-on-surface-variant">
            <Link
              to="/#projects"
              className="inline-flex items-center gap-1 text-on-surface-variant no-underline transition-colors hover:text-primary"
            >
              <MaterialIcon name="folder_open" className="text-base" />
              Projects
            </Link>
            <span>/</span>
            <span className="transition-colors hover:text-on-surface">
              {project.project_type}
            </span>
            <span>/</span>
            <span className="font-medium text-primary">{project.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 font-mono text-[11px] text-on-surface">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                Live demo available
              </span>
            ) : null}
            <Link
              to="/#projects"
              className="inline-flex items-center gap-1 rounded-lg bg-surface-container-lowest px-3 py-1.5 font-mono text-[13px] text-on-surface shadow-sm no-underline transition-all hover:-translate-y-0.5 hover:text-primary"
            >
              <MaterialIcon name="arrow_back" className="text-base" />
              <span>Back to All Projects</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Hero & vitals */}
      <section className="w-full bg-surface px-6 pt-10 pb-12 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 font-mono text-[11px] text-primary">
              <MaterialIcon name="verified" className="text-[15px]" />
              {project.project_type}
              {project.is_featured ? ' / Featured' : ''}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 font-mono text-[11px] text-on-surface">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  project.status === 'Ongoing'
                    ? 'bg-emerald-500'
                    : project.status === 'Completed'
                      ? 'bg-primary'
                      : 'bg-on-surface-variant',
                )}
              />
              Status: {project.status}
            </span>
            {dateLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 font-mono text-[11px] text-on-surface-variant">
                <MaterialIcon name="calendar_today" className="text-[15px]" />
                {dateLabel}
              </span>
            ) : null}
            {project.role ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 font-mono text-[11px] text-on-secondary-fixed">
                <MaterialIcon name="engineering" className="text-[15px]" />
                {project.role}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-3 lg:col-span-8">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-on-surface lg:text-4xl">
                {project.title}
              </h1>
              {project.short_description ? (
                <p className="max-w-3xl font-sans text-lg leading-relaxed text-on-surface-variant">
                  {project.short_description}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {project.live_url ? (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 font-mono text-[13px] text-on-primary shadow-sm no-underline transition-all hover:-translate-y-0.5 hover:bg-primary-container"
                  >
                    <MaterialIcon name="rocket_launch" className="text-lg" />
                    <span>Live Demo</span>
                    <MaterialIcon name="north_east" className="text-base" />
                  </a>
                ) : null}
                {project.github_url ? (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-highest px-5 py-2.5 font-mono text-[13px] text-on-surface shadow-sm no-underline transition-all hover:bg-surface-container-high"
                  >
                    <MaterialIcon name="terminal" className="text-lg" />
                    <span>GitHub Repository</span>
                    <MaterialIcon name="open_in_new" className="text-base" />
                  </a>
                ) : null}
                {project.docs_url ? (
                  <a
                    href={project.docs_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-low px-4 py-2.5 font-mono text-[13px] text-on-surface-variant no-underline transition-colors hover:text-primary"
                  >
                    <MaterialIcon name="description" className="text-lg" />
                    <span>Documentation</span>
                  </a>
                ) : null}
                {project.video_url ? (
                  <a
                    href={project.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-low px-4 py-2.5 font-mono text-[13px] text-on-surface-variant no-underline transition-colors hover:text-primary"
                  >
                    <MaterialIcon name="play_circle" className="text-lg" />
                    <span>Video Demo</span>
                  </a>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-md lg:col-span-4">
              <div className="flex items-center justify-between pb-1">
                <span className="font-mono text-[11px] tracking-wider text-on-surface-variant uppercase">
                  Project Specs
                </span>
                <span className="font-mono text-[11px] font-bold text-primary">
                  {project.platform}
                </span>
              </div>
              <div className="space-y-2 font-mono text-[11px] text-on-surface-variant">
                {stampRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-3 rounded bg-surface-container-low px-2 py-1"
                  >
                    <span>{row.label}:</span>
                    <span className="text-right font-medium text-on-surface">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-1 md:grid-cols-4">
            {[
              {
                label: 'Platform',
                value: project.platform,
                detail: 'Delivery surface',
                icon: 'devices',
              },
              {
                label: 'Project Type',
                value: project.project_type,
                detail: 'Engagement model',
                icon: 'category',
              },
              {
                label: 'Status',
                value: project.status,
                detail: dateLabel || 'Timeline on record',
                icon: 'verified_user',
              },
              {
                label: 'Stack Size',
                value: String(technologies.length || '—'),
                detail:
                  technologies.length === 1
                    ? 'Technology tagged'
                    : 'Technologies tagged',
                icon: 'bolt',
              },
            ].map((vital) => (
              <div
                key={vital.label}
                className="rounded-xl bg-surface-container-lowest p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between pb-1 text-on-surface-variant">
                  <span className="font-mono text-[11px] tracking-wide uppercase">
                    {vital.label}
                  </span>
                  <MaterialIcon
                    name={vital.icon}
                    className="text-xl text-primary"
                  />
                </div>
                <p className="font-display text-2xl font-semibold text-on-surface">
                  {vital.value}
                </p>
                <span className="font-sans text-sm text-on-surface-variant">
                  {vital.detail}
                </span>
              </div>
            ))}
          </div>

          <ProjectShowcase project={project} />
        </div>
      </section>

      {/* Overview */}
      {project.full_description ||
      project.objectives ||
      technologies.length > 0 ? (
        <section className="w-full bg-surface-container-low px-6 py-12 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-10">
            <div>
              <span className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
                System Background & Intent
              </span>
              <h2 className="font-display text-3xl font-semibold text-on-surface lg:text-4xl">
                Project Architecture & Challenge Overview
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="flex flex-col gap-6 lg:col-span-7">
                {project.full_description ? (
                  <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-error">
                      <MaterialIcon name="crisis_alert" className="text-2xl" />
                      <h3 className="font-display text-xl font-semibold text-on-surface">
                        The Problem Space
                      </h3>
                    </div>
                    <p className="whitespace-pre-line font-sans text-base leading-relaxed text-on-surface-variant">
                      {project.full_description}
                    </p>
                  </div>
                ) : null}

                {project.objectives ? (
                  <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-primary">
                      <MaterialIcon name="flag" className="text-2xl" />
                      <h3 className="font-display text-xl font-semibold text-on-surface">
                        Project Objectives
                      </h3>
                    </div>
                    <ObjectivesGrid text={project.objectives} />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 lg:col-span-5">
                <div className="flex flex-col gap-3 rounded-xl bg-primary-container p-6 text-on-primary shadow-md">
                  <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-on-primary">
                    <MaterialIcon name="developer_board" className="text-xl" />
                    Core Infrastructure Stack
                  </h3>
                  <p className="font-sans text-sm text-on-primary-container">
                    Technologies selected for this build, grouped from the
                    project inventory.
                  </p>
                  {technologies.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {technologies.map((tech) => (
                        <span
                          key={tech.id}
                          className="rounded bg-on-primary/20 px-2.5 py-1 font-mono text-[11px] text-on-primary"
                        >
                          {tech.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-sans text-sm text-on-primary-container">
                      No technologies tagged yet.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
                  <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-on-surface">
                    <MaterialIcon
                      name="info"
                      className="text-xl text-primary"
                    />
                    Delivery Snapshot
                  </h3>
                  <div className="space-y-3 font-sans text-sm">
                    <div className="rounded-lg bg-surface-container-low p-3">
                      <p className="font-semibold text-on-surface">Platform</p>
                      <p className="text-[13px] text-on-surface-variant">
                        {project.platform}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low p-3">
                      <p className="font-semibold text-on-surface">
                        Engagement Type
                      </p>
                      <p className="text-[13px] text-on-surface-variant">
                        {project.project_type}
                        {project.role ? ` · ${project.role}` : ''}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low p-3">
                      <p className="font-semibold text-on-surface">Timeline</p>
                      <p className="text-[13px] text-on-surface-variant">
                        {dateLabel || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Features */}
      {project.project_features.length > 0 ? (
        <section className="w-full bg-surface px-6 py-12 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-10">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <span className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
                  Platform Capabilities
                </span>
                <h2 className="font-display text-3xl font-semibold text-on-surface lg:text-4xl">
                  Key Features
                </h2>
              </div>
              <p className="max-w-md font-sans text-sm text-on-surface-variant">
                Capabilities documented for this system, pulled from the project
                feature inventory.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {project.project_features.map((feature, index) => (
                <article
                  key={feature.id}
                  className="group flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-lg"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                      <MaterialIcon
                        name={FEATURE_ICONS[index % FEATURE_ICONS.length]}
                        className="text-2xl"
                      />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-on-surface">
                      {feature.title}
                    </h3>
                    {feature.description ? (
                      <p className="font-sans text-sm text-on-surface-variant">
                        {feature.description}
                      </p>
                    ) : null}
                    {feature.image_url ? (
                      <img
                        src={feature.image_url}
                        alt={feature.title}
                        className="mt-1 aspect-video w-full rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-center gap-1 pt-2 font-mono text-[11px] text-primary">
                    <span>Capability {String(index + 1).padStart(2, '0')}</span>
                    <MaterialIcon name="arrow_forward" className="text-base" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Contributions */}
      {contributionTracks.length > 0 ? (
        <section className="w-full bg-surface-container-low px-6 py-12 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-10">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
                Individual Execution
              </span>
              <h2 className="font-display text-3xl font-semibold text-on-surface lg:text-4xl">
                Key Technical Contributions
              </h2>
              <p className="max-w-2xl font-sans text-base text-on-surface-variant">
                Documented contributions from the project record, presented in
                dual delivery tracks.
              </p>
            </div>

            <div
              className={cn(
                'grid grid-cols-1 gap-6',
                contributionTracks.length > 1 ? 'lg:grid-cols-2' : '',
              )}
            >
              {contributionTracks.map((track) => (
                <div
                  key={track.key}
                  className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-md"
                >
                  <div className="flex items-center justify-between gap-3 pb-2">
                    <div className="flex items-center gap-2">
                      <MaterialIcon
                        name={track.icon}
                        className="text-[28px] text-primary"
                      />
                      <h3 className="font-display text-xl font-semibold text-on-surface">
                        {track.title}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        'rounded px-2 py-1 font-mono text-[11px]',
                        track.badgeClass,
                      )}
                    >
                      {track.badge}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {track.items.map((item, index) => (
                      <div key={item.id} className="flex gap-3">
                        <span className="font-mono text-[13px] font-bold text-primary">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h4 className="font-display text-base font-semibold text-on-surface">
                            {item.title}
                          </h4>
                          {item.description ? (
                            <p className="font-sans text-sm text-on-surface-variant">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Technologies */}
      {techGroups.length > 0 ? (
        <section className="w-full bg-surface px-6 py-12 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <div>
              <span className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
                Stack Composition
              </span>
              <h2 className="font-display text-3xl font-semibold text-on-surface lg:text-4xl">
                Technologies & Libraries Implemented
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {techGroups.map(([category, techs]) => (
                <div
                  key={category}
                  className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-4"
                >
                  <span className="font-mono text-[13px] font-bold text-primary">
                    {category}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {techs.map((tech) => (
                      <span
                        key={tech.id}
                        className="rounded bg-surface-container-lowest px-2.5 py-1 font-mono text-[11px] text-on-surface shadow-sm"
                      >
                        {tech.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Gallery */}
      {project.project_media.length > 0 ? (
        <section className="w-full bg-surface-container-low px-6 py-12 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <ProjectGallery
              media={project.project_media}
              projectTitle={project.title}
            />
          </div>
        </section>
      ) : null}

      {/* Related */}
      {related.length > 0 ? (
        <section
          className={cn(
            'w-full px-6 py-12 lg:px-12',
            project.project_media.length > 0
              ? 'bg-surface'
              : 'bg-surface-container-low',
          )}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
                  Portfolio Exploration
                </span>
                <h2 className="font-display text-3xl font-semibold text-on-surface lg:text-4xl">
                  More Systems
                </h2>
              </div>
              <Link
                to="/#projects"
                className="inline-flex items-center gap-1 font-mono text-[13px] text-primary no-underline hover:underline"
              >
                <span>View All Work</span>
                <MaterialIcon name="arrow_forward" className="text-lg" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {related.map((item) => (
                <RelatedProjectCard key={item.id} project={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="w-full bg-surface px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 rounded-xl bg-primary p-8 text-on-primary shadow-xl md:flex-row lg:p-10">
            <div className="flex max-w-2xl flex-col gap-2">
              <span className="font-mono text-[11px] tracking-widest text-on-primary-container uppercase">
                Next Steps & Technical Inquiries
              </span>
              <h2 className="font-display text-3xl font-semibold text-on-primary">
                Interested in this system architecture or want to review the
                source?
              </h2>
              <p className="font-sans text-base text-on-primary-container">
                Reach out to discuss full-stack engineering, systems analysis,
                or how similar solutions could fit your organization.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              <Link
                to="/#contact"
                className="inline-flex items-center gap-2 rounded-lg bg-surface-container-lowest px-6 py-3 font-mono text-[13px] text-primary shadow-md no-underline transition-all hover:bg-surface-container-high"
              >
                <MaterialIcon name="mail" className="text-lg" />
                <span>Contact</span>
              </Link>
              <Link
                to="/#projects"
                className="inline-flex items-center gap-2 rounded-lg bg-on-primary/10 px-5 py-3 font-mono text-[13px] text-on-primary no-underline transition-colors hover:bg-on-primary/20"
              >
                <span>Explore Other Projects</span>
                <MaterialIcon name="arrow_forward" className="text-base" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
