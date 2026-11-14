import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { AboutSection } from '@/components/public/AboutSection'
import { CertificationsSection } from '@/components/public/CertificationsSection'
import { ContactSection } from '@/components/public/ContactSection'
import { ExperienceSection } from '@/components/public/ExperienceSection'
import { FeaturedProjectsSection } from '@/components/public/FeaturedProjectsSection'
import { FloatingActions } from '@/components/public/FloatingActions'
import { HeroSection } from '@/components/public/HeroSection'
import { HobbiesSection } from '@/components/public/HobbiesSection'
import { ProjectsArchiveSection } from '@/components/public/ProjectsArchiveSection'
import { SkillsSection } from '@/components/public/SkillsSection'
import { useRealtimePortfolio } from '@/hooks/useRealtimePortfolio'
import { ADMIN_EMAIL } from '@/lib/constants'

export function HomePage() {
  const { data, error, loading, live, reload } = useRealtimePortfolio()
  const location = useLocation()

  useEffect(() => {
    if (loading || !location.hash) return
    const id = location.hash.replace('#', '')
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [loading, location.hash, data])

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
        <LoadingState rows={5} />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }

  const portfolio = data!
  const email =
    portfolio.contactSettings.support_email ||
    portfolio.profile?.email ||
    ADMIN_EMAIL
  const { sections, content } = portfolio

  return (
    <>
      <PublicHeader
        profile={portfolio.profile}
        resume={portfolio.resume}
        navItems={portfolio.headerNav}
        headerContent={content.header}
      />

      <div className="flex w-full flex-col">
        <HeroSection
          profile={portfolio.profile}
          resume={portfolio.resume}
          socialLinks={portfolio.socialLinks}
          projectCount={portfolio.projects.length}
          content={content.hero}
        />
        {portfolio.settings.show_about !== false ? (
          <AboutSection
            profile={portfolio.profile}
            education={portfolio.education}
            skills={portfolio.skills}
            section={sections.about}
            content={content.about}
            specializationCards={portfolio.specializationCards}
          />
        ) : null}
        {portfolio.settings.show_highlighted_skills !== false ? (
          <SkillsSection
            skills={portfolio.skills}
            section={sections.skills}
            skillCategories={portfolio.skillCategories}
          />
        ) : null}
        {portfolio.settings.show_featured_projects !== false ? (
          <FeaturedProjectsSection
            projects={portfolio.featuredProjects}
            section={sections.featured_projects}
          />
        ) : null}
        <ProjectsArchiveSection
          projects={portfolio.projects}
          section={sections.projects}
        />
        {portfolio.settings.show_experience !== false ? (
          <ExperienceSection
            experiences={portfolio.experiences}
            education={portfolio.education}
            section={sections.experience}
            content={content.experience}
          />
        ) : null}
        {portfolio.settings.show_hobbies !== false ? (
          <HobbiesSection
            hobbies={portfolio.hobbies}
            section={sections.hobbies}
            content={content.hobbies}
          />
        ) : null}
        {portfolio.settings.show_certifications !== false ? (
          <CertificationsSection
            certifications={portfolio.certifications}
            awards={portfolio.awards}
            awardCategories={portfolio.awardCategories}
            showCertifications={
              portfolio.credentialsDisplay.show_certifications_group
            }
            showAwards={portfolio.credentialsDisplay.show_awards_group}
            section={sections.certifications}
          />
        ) : null}
        <ContactSection
          profile={portfolio.profile}
          socialLinks={portfolio.socialLinks}
          contactSettings={portfolio.contactSettings}
          section={sections.contact}
          content={content.contact}
        />
      </div>

      <FloatingActions live={live} content={content.floating_actions} />
      <PublicFooter
        profile={portfolio.profile}
        socialLinks={portfolio.socialLinks}
        email={email}
        footerContent={content.footer}
        footerNav={portfolio.footerNav}
        live={live}
      />
    </>
  )
}
