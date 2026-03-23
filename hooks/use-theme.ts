'use client'
import { useEffect } from 'react'
import { useSettingsStore } from '@/lib/store/settings.store'

/**
 * Applies the current theme from the settings store to <html>.
 * Call this once near the top of the app layout (e.g. AppShell).
 */
export function useTheme() {
  const theme = useSettingsStore(state => state.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (!prefersDark) root.classList.add('light')
    } else if (theme === 'light') {
      root.classList.add('light')
    }
    // 'dark' is the default — no class needed
  }, [theme])

  return { theme }
}
