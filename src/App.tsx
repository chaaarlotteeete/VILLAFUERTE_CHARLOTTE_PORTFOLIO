import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppRoutes } from '@/routes/AppRoutes'

function getBasename() {
  const base = import.meta.env.BASE_URL
  if (!base || base === '/') return undefined
  return base.replace(/\/$/, '')
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename={getBasename()}>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
