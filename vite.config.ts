import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GITHUB_REPOSITORY is "owner/repo", set by GitHub Actions on every run.
const [owner, repoName] = process.env.GITHUB_REPOSITORY?.split('/') ?? []
// The GitHub Pages address, for og:url in index.html.
const siteUrl = repoName ? `https://${owner}.github.io/${repoName}/` : 'http://localhost:5173/'

export default defineConfig({
  base: repoName ? `/${repoName}/` : '/',
  plugins: [
    react(),
    tailwindcss(),
    { name: 'site-url', transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl) },
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
