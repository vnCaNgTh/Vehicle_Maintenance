// GitHub Pages has no server-side rewrites, so deep links (e.g. /vehicles/123)
// 404 on refresh/direct navigation. Serving a copy of index.html as 404.html
// makes GitHub Pages fall back to the SPA shell, which then renders the
// correct route client-side via React Router.
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const distDir = resolve(import.meta.dirname, '..', 'dist')
const indexHtml = resolve(distDir, 'index.html')
const notFoundHtml = resolve(distDir, '404.html')

if (!existsSync(indexHtml)) {
  throw new Error(`Cannot create 404.html: ${indexHtml} does not exist. Run the build first.`)
}

copyFileSync(indexHtml, notFoundHtml)
