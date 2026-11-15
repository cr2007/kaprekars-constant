import { useEffect, useRef, useState } from 'react'

type Theme = 'light' | 'dark'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Reads the theme the user picked earlier, or null if they never picked one. */
function getStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage is blocked (privacy settings, sandboxed frame): use the OS theme.
  }
  return null
}

/** Returns the OS theme. */
function getSystemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/**
 * Tracks the light/dark theme and toggles the `dark` class on `<html>` so
 * Tailwind's `dark:` variant picks it up.
 *
 * The theme follows the OS setting, also when it changes, until the user
 * picks one with {@link toggleTheme}. Only that pick goes to `localStorage`.
 *
 * A blocking script in `index.html` applies the same class before React
 * mounts, so there is no flash of the wrong theme on load. A flip turns
 * transitions off for one style flush, so every color changes in the
 * same frame.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme())
  // A ref, not storage, so a pick holds for the page load even when storage is blocked.
  const userPicked = useRef(getStoredTheme() !== null)

  useEffect(() => {
    // Step 1: turn transitions off, so no color fades after the page has switched.
    const root = document.documentElement
    root.dataset.themeFlip = ''
    root.classList.toggle('dark', theme === 'dark')

    // Step 2: flush styles once with the new colors, then turn transitions back on.
    void root.offsetHeight
    delete root.dataset.themeFlip
  }, [theme])

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    function followSystem(event: MediaQueryListEvent) {
      if (!userPicked.current) setTheme(event.matches ? 'dark' : 'light')
    }
    query.addEventListener('change', followSystem)
    return () => query.removeEventListener('change', followSystem)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    userPicked.current = true
    setTheme(next)
    try {
      window.localStorage.setItem('theme', next)
    } catch {
      // Storage is blocked: the pick lasts for this page load only.
    }
  }

  return { theme, toggleTheme }
}
