import { Navigate, Route, Routes } from 'react-router-dom'

import { AdminLayout } from '@/layouts/AdminLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AdminAboutContentPage } from '@/pages/admin/AdminAboutContentPage'
import { AdminAccountPage } from '@/pages/admin/AdminAccountPage'
import { AdminCertificationsPage } from '@/pages/admin/AdminCertificationsPage'
import { AdminContactContentPage } from '@/pages/admin/AdminContactContentPage'
import { AdminContentPage } from '@/pages/admin/AdminContentPage'
import { AdminFloatingActionsPage } from '@/pages/admin/AdminFloatingActionsPage'
import { AdminFooterAppearancePage } from '@/pages/admin/AdminFooterAppearancePage'
import { AdminHeaderAppearancePage } from '@/pages/admin/AdminHeaderAppearancePage'
import { AdminHeroContentPage } from '@/pages/admin/AdminHeroContentPage'
import { AdminHomepageSettingsPage } from '@/pages/admin/AdminHomepageSettingsPage'
import { AdminAwardsPage } from '@/pages/admin/AdminAwardsPage'
import { AdminEducationPage } from '@/pages/admin/AdminEducationPage'
import { AdminTrainingPage } from '@/pages/admin/AdminTrainingPage'
import { AdminExperiencePage } from '@/pages/admin/AdminExperiencePage'
import { AdminHobbiesPage } from '@/pages/admin/AdminHobbiesPage'
import { AdminHobbyFormPage } from '@/pages/admin/AdminHobbyFormPage'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminMediaPage } from '@/pages/admin/AdminMediaPage'
import { AdminMessagesPage } from '@/pages/admin/AdminMessagesPage'
import { AdminProfilePage } from '@/pages/admin/AdminProfilePage'
import { AdminProjectFormPage } from '@/pages/admin/AdminProjectFormPage'
import { AdminProjectsPage } from '@/pages/admin/AdminProjectsPage'
import { AdminResumesPage } from '@/pages/admin/AdminResumesPage'
import { AdminSectionChromePage } from '@/pages/admin/AdminSectionChromePage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { AdminSkillsPage } from '@/pages/admin/AdminSkillsPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { HomePage } from '@/pages/public/HomePage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { ProjectDetailPage } from '@/pages/public/ProjectDetailPage'
import { SectionRedirect } from '@/pages/public/SectionRedirect'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="projects/:slug" element={<ProjectDetailPage />} />
        <Route path="about" element={<SectionRedirect hash="about" />} />
        <Route path="skills" element={<SectionRedirect hash="skills" />} />
        <Route path="projects" element={<SectionRedirect hash="projects" />} />
        <Route
          path="experience"
          element={<SectionRedirect hash="experience" />}
        />
        <Route
          path="education"
          element={<SectionRedirect hash="experience" />}
        />
        <Route path="hobbies" element={<SectionRedirect hash="hobbies" />} />
        <Route
          path="certifications"
          element={<SectionRedirect hash="certifications" />}
        />
        <Route path="contact" element={<SectionRedirect hash="contact" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="projects/new" element={<AdminProjectFormPage />} />
          <Route path="projects/:id/edit" element={<AdminProjectFormPage />} />
          <Route path="skills" element={<AdminSkillsPage />} />
          <Route path="experience" element={<AdminExperiencePage />} />
          <Route path="education" element={<AdminEducationPage />} />
          <Route path="training" element={<AdminTrainingPage />} />
          <Route path="awards" element={<AdminAwardsPage />} />
          <Route path="hobbies" element={<AdminHobbiesPage />} />
          <Route path="hobbies/new" element={<AdminHobbyFormPage />} />
          <Route path="hobbies/:id/edit" element={<AdminHobbyFormPage />} />
          <Route path="certifications" element={<AdminCertificationsPage />} />
          <Route path="resume" element={<AdminResumesPage />} />
          <Route path="resumes" element={<Navigate to="/admin/resume" replace />} />
          <Route path="media" element={<AdminMediaPage />} />
          <Route path="messages" element={<AdminMessagesPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route path="content/hero" element={<AdminHeroContentPage />} />
          <Route path="content/about" element={<AdminAboutContentPage />} />
          <Route path="content/contact" element={<AdminContactContentPage />} />
          <Route path="content/:sectionKey" element={<AdminSectionChromePage />} />
          <Route path="appearance/header" element={<AdminHeaderAppearancePage />} />
          <Route path="appearance/footer" element={<AdminFooterAppearancePage />} />
          <Route
            path="appearance/floating-actions"
            element={<AdminFloatingActionsPage />}
          />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="settings/homepage" element={<AdminHomepageSettingsPage />} />
          <Route path="account" element={<AdminAccountPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
