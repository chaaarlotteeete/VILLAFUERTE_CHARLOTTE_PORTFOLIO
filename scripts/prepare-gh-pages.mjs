/**
 * Post-build helper for GitHub Pages:
 * - writes .nojekyll
 * - regenerates 404.html SPA fallback using VITE_BASE_PATH
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')

let base = process.env.VITE_BASE_PATH || '/VILLAFUERTE_CHARLOTTE_PORTFOLIO/'
if (!base.startsWith('/')) base = `/${base}`
if (!base.endsWith('/')) base = `${base}/`

mkdirSync(dist, { recursive: true })
writeFileSync(resolve(dist, '.nojekyll'), '')

const spaFallback = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redirecting…</title>
    <script>
      // GitHub Pages SPA fallback for deep links (e.g. /projects/:slug).
      sessionStorage.setItem(
        'gh-pages-redirect',
        location.pathname + location.search + location.hash,
      )
      location.replace('${base}')
    </script>
  </head>
  <body></body>
</html>
`

writeFileSync(resolve(dist, '404.html'), spaFallback)
console.log(`GitHub Pages assets prepared (base=${base})`)
