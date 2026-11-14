import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BookOpen,
  Briefcase,
  Code2,
  ExternalLink,
  FileText,
  Heart,
  Home,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Paintbrush,
  Settings,
  Trophy,
  User,
  UserCog,
  FolderKanban,
  GraduationCap,
  Newspaper,
} from 'lucide-react'

export interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
  end?: boolean
}

export const ADMIN_PRIMARY_NAV: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { label: 'Skills & Technologies', href: '/admin/skills', icon: Code2 },
  { label: 'Experience', href: '/admin/experience', icon: Briefcase },
  { label: 'Education', href: '/admin/education', icon: GraduationCap },
  { label: 'Training', href: '/admin/training', icon: BookOpen },
  { label: 'Awards & Achievements', href: '/admin/awards', icon: Trophy },
  { label: 'Hobbies & Interests', href: '/admin/hobbies', icon: Heart },
  { label: 'Certifications', href: '/admin/certifications', icon: Award },
  { label: 'Resume', href: '/admin/resume', icon: FileText },
  { label: 'Media Library', href: '/admin/media', icon: Images },
  { label: 'Contact Messages', href: '/admin/messages', icon: Mail },
  { label: 'Website Content', href: '/admin/content', icon: Newspaper },
  { label: 'Appearance', href: '/admin/appearance/header', icon: Paintbrush },
  { label: 'Homepage Sections', href: '/admin/settings/homepage', icon: Home },
  { label: 'Profile', href: '/admin/profile', icon: User },
  { label: 'Site Settings', href: '/admin/settings', icon: Settings },
]

export const ADMIN_BOTTOM_NAV = {
  publicSite: {
    label: 'View Public Website',
    href: '/',
    icon: ExternalLink,
  },
  account: {
    label: 'Admin Account',
    href: '/admin/account',
    icon: UserCog,
  },
  logout: {
    label: 'Logout',
    icon: LogOut,
  },
} as const

export const ADMIN_SIDEBAR_STORAGE_KEY = 'admin-sidebar-collapsed'
