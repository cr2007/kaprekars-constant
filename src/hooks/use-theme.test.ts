import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { THEME_COLOR } from './use-theme'

test('the theme-color tags in index.html match THEME_COLOR', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf-8')
  for (const scheme of ['light', 'dark'] as const) {
    const tag = html.match(new RegExp(`name="theme-color" media="\\(prefers-color-scheme: ${scheme}\\)" content="([^"]+)"`))
    expect(tag?.[1]).toBe(THEME_COLOR[scheme])
  }
})
