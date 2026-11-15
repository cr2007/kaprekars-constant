import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

/** Reads the stored theme, falling back to the OS preference on first visit. */
function getInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage is blocked (privacy settings, sandboxed frame): use the OS theme.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Tracks the light/dark theme, persists it to `localStorage`, and toggles
 * the `dark` class on `<html>` so Tailwind's `dark:` variant picks it up.
 *
 * A blocking script in `index.html` applies the same class before React
 * mounts, so there is no flash of the wrong theme on load.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      window.localStorage.setItem('theme', theme)
    } catch {
      // Storage is blocked: the theme lasts for this page load only.
    }
  }, [theme])

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}
