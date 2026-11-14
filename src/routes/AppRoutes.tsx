import { Navigate, Route, Routes } from 'react-router-dom'

import { AdminLayout } from '@/layouts/AdminLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AdminAccountPage } from '@/pages/admin/AdminAccountPage'
import { AdminCertificationsPage } from '@/pages/admin/AdminCertificationsPage'
import { AdminEducationPage } from '@/pages/admin/AdminEducationPage'
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
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { AdminSkillsPage } from '@/pages/admin/AdminSkillsPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { AboutPage } from '@/pages/public/AboutPage'
import { CertificationsPage } from '@/pages/public/CertificationsPage'
import { ContactPage } from '@/pages/public/ContactPage'
import { EducationPage } from '@/pages/public/EducationPage'
import { ExperiencePage } from '@/pages/public/ExperiencePage'
import { HobbiesPage } from '@/pages/public/HobbiesPage'
import { HomePage } from '@/pages/public/HomePage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { ProjectDetailPage } from '@/pages/public/ProjectDetailPage'
import { ProjectsPage } from '@/pages/public/ProjectsPage'
import { SkillsPage } from '@/pages/public/SkillsPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:slug" element={<ProjectDetailPage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="experience" element={<ExperiencePage />} />
        <Route path="education" element={<EducationPage />} />
        <Route path="hobbies" element={<HobbiesPage />} />
        <Route path="certifications" element={<CertificationsPage />} />
        <Route path="contact" element={<ContactPage />} />
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
          <Route path="hobbies" element={<AdminHobbiesPage />} />
          <Route path="hobbies/new" element={<AdminHobbyFormPage />} />
          <Route path="hobbies/:id/edit" element={<AdminHobbyFormPage />} />
          <Route path="certifications" element={<AdminCertificationsPage />} />
          <Route path="resume" element={<AdminResumesPage />} />
          <Route path="resumes" element={<Navigate to="/admin/resume" replace />} />
          <Route path="media" element={<AdminMediaPage />} />
          <Route path="messages" element={<AdminMessagesPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="account" element={<AdminAccountPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
