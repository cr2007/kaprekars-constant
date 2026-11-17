import { useEffect, useRef, useState } from 'react'

/** A theme the user can pick. */
type Theme = 'light' | 'dark'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** The browser bar color for each theme: the same values as the theme-color tags in index.html. */
const THEME_COLOR: Record<Theme, string> = { light: '#edf8f3', dark: '#05100c' }

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
 * Tracks the light or dark theme and sets the `dark` class on `<html>` for Tailwind's `dark:` variant.
 *
 * @remarks
 * - The theme follows the OS setting, also when it changes, until the user picks one with `toggleTheme`.
 * - Only that pick goes to `localStorage`.
 * - A blocking script in `index.html` applies the same class before React mounts, so the wrong theme never flashes.
 * - A flip turns transitions off for one style flush, so every color changes in the same frame.
 * - The theme-color tags follow the theme, so the browser bars match a pick that differs from the OS.
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
    // The tags pick a color by the OS theme, so a picked theme sets both. Phone browsers paint their bars with it.
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) meta.content = THEME_COLOR[theme]

    // Step 2: flush styles once with the new colors, then turn transitions back on.
    void root.offsetHeight
    delete root.dataset.themeFlip
  }, [theme])

  useEffect(() => {
    // Follow the OS theme until the user picks one.
    const query = window.matchMedia(DARK_QUERY)
    function followSystem(event: MediaQueryListEvent) {
      if (!userPicked.current) setTheme(event.matches ? 'dark' : 'light')
    }
    query.addEventListener('change', followSystem)
    return () => query.removeEventListener('change', followSystem)
  }, [])

  /** Flips the theme and marks it as the user's pick, so the OS theme no longer drives it. */
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
