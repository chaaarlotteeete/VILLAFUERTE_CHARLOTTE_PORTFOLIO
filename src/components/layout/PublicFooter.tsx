import { Link } from 'react-router-dom'

import { SITE_TITLE } from '@/lib/constants'

const COPYRIGHT_YEAR = 2026

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {COPYRIGHT_YEAR} {SITE_TITLE}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/projects" className="hover:text-foreground">
            Projects
          </Link>
          <Link to="/hobbies" className="hover:text-foreground">
            Hobbies
          </Link>
          <Link to="/contact" className="hover:text-foreground">
            Contact
          </Link>
          <Link to="/admin/login" className="hover:text-foreground">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  )
}
