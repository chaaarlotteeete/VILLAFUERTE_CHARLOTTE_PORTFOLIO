import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        The page you requested does not exist or is no longer available.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  )
}
