import { ExternalLink, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/PageHeader'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_EMAIL } from '@/lib/constants'

export function AdminAccountPage() {
  const { user, signOut, resetPassword } = useAuth()

  async function handleResetPassword() {
    const email = user?.email || ADMIN_EMAIL
    const result = await resetPassword(email)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Password reset email sent.')
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Account"
        description="Signed-in administrator details and account actions."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </p>
            <p className="mt-1 text-sm">{user?.email ?? ADMIN_EMAIL}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Role
            </p>
            <p className="mt-1 text-sm">Administrator</p>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Theme
              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void handleResetPassword()}>
              Send password reset email
            </Button>
            <Button asChild variant="secondary">
              <Link to="/" target="_blank" rel="noreferrer">
                <ExternalLink />
                View public website
              </Link>
            </Button>
            <Button type="button" variant="destructive" onClick={() => void signOut()}>
              <LogOut />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
