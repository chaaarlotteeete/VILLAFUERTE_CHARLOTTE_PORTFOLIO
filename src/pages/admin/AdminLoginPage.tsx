import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { SITE_TITLE } from '@/lib/constants'

export function AdminLoginPage() {
  const { signIn, resetPassword, user, isAdmin, loading } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setInfo(null)
    const result = await signIn(email, password)
    if (result.error) {
      setError(result.error)
    }
    setSubmitting(false)
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }
    setError(null)
    setInfo(null)
    const result = await resetPassword(email.trim())
    if (result.error) {
      setError(result.error)
      return
    }
    setInfo('Password reset email sent if the account exists.')
  }

  const unauthorized = Boolean(
    (location.state as { unauthorized?: boolean } | null)?.unauthorized,
  )

  return (
    <div className="relative flex min-h-svh items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.92_0.03_230/0.7),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.28_0.04_250/0.5),transparent_55%)]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
            CV
          </div>
          <p className="font-display text-lg font-semibold tracking-tight">
            {SITE_TITLE}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Administration</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/95 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="mb-6 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Secure access
              </span>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your administrator account. Public registration is
              disabled.
            </p>
          </div>

          {unauthorized ? (
            <p
              className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              Your account is authenticated but not authorized as an
              administrator.
            </p>
          ) : null}

          {user && !isAdmin && !unauthorized ? (
            <p
              className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              Signed in, but this account does not have admin access.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="link"
                className="h-auto px-0 text-sm"
                onClick={() => void handleForgotPassword()}
              >
                Forgot Password
              </Button>
            </div>

            {error ? (
              <p
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            {info ? (
              <p
                className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
                role="status"
              >
                {info}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting || loading}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
