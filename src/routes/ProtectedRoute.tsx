import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { LoadingState } from '@/components/common/LoadingState'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute() {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <LoadingState rows={2} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ unauthorized: true }} />
  }

  return <Outlet />
}
