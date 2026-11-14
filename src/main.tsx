import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import '@/index.css'

const redirect = sessionStorage.getItem('gh-pages-redirect')
if (redirect) {
  sessionStorage.removeItem('gh-pages-redirect')
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const nextPath = redirect.startsWith(base)
    ? redirect.slice(base.length) || '/'
    : redirect
  window.history.replaceState(null, '', `${base}${nextPath}`)
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
