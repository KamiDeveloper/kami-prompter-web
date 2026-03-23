'use client'
import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useSettingsStore } from '@/lib/store/settings.store'
import { useTheme } from '@/hooks/use-theme'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { BottomNav } from './bottom-nav'
import { Loader2 } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const setSettings = useSettingsStore(state => state.setSettings)
  const setApiKeyStatus = useSettingsStore(state => state.setApiKeyStatus)
  useTheme() // applies theme class reactively to <html>

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        router.replace('/login')
        return
      }
      
      setUser(session.user)

      try {
        const settingsRes = await fetch('/api/user/settings')

        if (settingsRes.ok) {
          const { data: settings } = await settingsRes.json()
          if (settings) {
            setSettings({
              defaultModel: settings.default_model,
              defaultThinkingLevel: settings.default_thinking_level,
              usePaidKeyForAll: settings.use_paid_key_for_all,
              showNsfw: settings.show_nsfw,
              theme: settings.theme,
              defaultExportFormat: settings.default_export_format,
              prdDefaultDetail: settings.prd_default_detail,
              prdDefaultLanguage: settings.prd_default_language
            })
            
            // Apply theme
            const root = document.documentElement
            root.classList.remove('light', 'dark')
            if (settings.theme === 'system') {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
              if (!prefersDark) root.classList.add('light')
            } else if (settings.theme === 'light') {
              root.classList.add('light')
            }
          }
        }
        
        // Verify API keys
        const [flashRes, proRes] = await Promise.all([
          fetch('/api/keys/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyType: 'flash_free' }) }),
          fetch('/api/keys/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyType: 'pro_paid' }) })
        ])
        
        if (flashRes.ok) {
          const { data } = await flashRes.json()
          setApiKeyStatus('flash', data?.isValid ? 'configured' : 'invalid')
        } else {
          setApiKeyStatus('flash', 'not_configured')
        }

        if (proRes.ok) {
          const { data } = await proRes.json()
          setApiKeyStatus('pro', data?.isValid ? 'configured' : 'invalid')
        } else {
          setApiKeyStatus('pro', 'not_configured')
        }

      } catch (e: unknown) {
        console.error('Failed to load user info', e instanceof Error ? e.message : e)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router, setSettings, setApiKeyStatus])

  // Separate effect for pathname-dependent UI resets (e.g. close mobile drawer)
  React.useEffect(() => {
    // nothing needed yet — drawer state lives in Sidebar itself
  }, [pathname])

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-(--color-bg) text-text-primary">
        <Loader2 className="animate-spin text-accent mb-4" size={32} />
        <p className="text-sm font-medium animate-pulse">Cargando tu entorno...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-(--color-bg) text-text-primary">
      <Sidebar user={user} />
      <Topbar user={user} />
      
      {/* 
        Layout offsets:
        Desktop: pl-[240px] pt-0
        Tablet: pt-14
        Mobile: pt-14 pb-16
      */}
      <main className="flex min-h-screen flex-col xl:pl-60 pt-14 xl:pt-0 pb-16 md:pb-0">
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
