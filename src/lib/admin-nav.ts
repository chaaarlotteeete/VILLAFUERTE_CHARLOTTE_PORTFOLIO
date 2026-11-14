import type { LucideIcon } from 'lucide-react'
import {
  Award,
  Briefcase,
  Code2,
  ExternalLink,
  FileText,
  Heart,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  User,
  UserCog,
  FolderKanban,
  GraduationCap,
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
  { label: 'Hobbies & Interests', href: '/admin/hobbies', icon: Heart },
  { label: 'Certifications', href: '/admin/certifications', icon: Award },
  { label: 'Resume', href: '/admin/resume', icon: FileText },
  { label: 'Media Library', href: '/admin/media', icon: Images },
  { label: 'Contact Messages', href: '/admin/messages', icon: Mail },
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
