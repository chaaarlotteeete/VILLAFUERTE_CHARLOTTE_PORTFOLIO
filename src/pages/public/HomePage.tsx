import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { SocialLinks } from '@/components/common/SocialLinks'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAsyncData } from '@/hooks/useAsyncData'
import { SITE_TITLE } from '@/lib/constants'
import { fetchHomepageData } from '@/services/homepage'

export function HomePage() {
  const { data, error, loading, reload } = useAsyncData(fetchHomepageData)

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const profile = data?.profile
  const featuredProjects = data?.featuredProjects ?? []
  const skills = data?.skills ?? []
  const resume = data?.resume
  const socialLinks = data?.socialLinks ?? []
  const settings = data?.settings

  const displayName = profile?.full_name || SITE_TITLE
  const title = profile?.title
  const intro = profile?.short_intro || profile?.career_objective
  const showFeatured = settings?.show_featured_projects ?? true
  const showSkills = settings?.show_highlighted_skills ?? true

  return (
    <div className="space-y-14">
      <section className="grid items-center gap-8 rounded-2xl border bg-card/70 p-6 shadow-sm sm:p-10 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Personal IT Portfolio
          </p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{displayName}</h1>
          {title ? (
            <p className="mt-3 text-xl text-muted-foreground">{title}</p>
          ) : null}
          {intro ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {intro}
            </p>
          ) : (
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Profile content will appear here once updated in the admin dashboard.
            </p>
          )}
          {profile?.specialization ? (
            <p className="mt-4 text-sm font-medium">
              Specialization: {profile.specialization}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/projects">View Projects</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/about">About Me</Link>
            </Button>
            {resume ? (
              <Button asChild variant="secondary">
                <a href={resume.file_url} target="_blank" rel="noreferrer">
                  Download Resume
                </a>
              </Button>
            ) : null}
            <Button asChild variant="ghost">
              <Link to="/contact">Contact Me</Link>
            </Button>
          </div>

          <div className="mt-6">
            <SocialLinks links={socialLinks} email={profile?.email} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border bg-muted shadow-sm"
        >
          {profile?.profile_image_url ? (
            <img
              src={profile.profile_image_url}
              alt={displayName}
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Add a profile image from the admin dashboard.
            </div>
          )}
        </motion.div>
      </section>

      {showFeatured ? (
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold">Featured Projects</h2>
              <p className="mt-2 text-muted-foreground">
                Highlighted work selected from published projects.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/projects">Browse all</Link>
            </Button>
          </div>
          {featuredProjects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No featured projects yet"
              description="Mark published projects as featured in the admin dashboard to show them here."
            />
          )}
        </section>
      ) : null}

      {showSkills ? (
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-semibold">Highlighted Skills</h2>
            <p className="mt-2 text-muted-foreground">
              A snapshot of technical skills managed from Supabase.
            </p>
          </div>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm"
                >
                  {skill.name}
                </Badge>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No skills published yet"
              description="Add skills in the admin dashboard to highlight them on the homepage."
            />
          )}
        </section>
      ) : null}
    </div>
  )
}
