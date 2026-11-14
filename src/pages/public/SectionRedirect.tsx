import { Navigate } from 'react-router-dom'

interface SectionRedirectProps {
  hash: string
}

export function SectionRedirect({ hash }: SectionRedirectProps) {
  return <Navigate to={{ pathname: '/', hash }} replace />
}
