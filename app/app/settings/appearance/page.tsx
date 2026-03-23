'use client'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Modal } from '@/components/ui/modal'
import { useSettingsStore } from '@/lib/store/settings.store'
import { useTheme } from '@/hooks/use-theme'
import { useToast } from '@/hooks/use-toast'
import { Monitor, Sun, Moon, Loader2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Metadata } from 'next'

type ThemeMode = 'dark' | 'light' | 'system'

const THEMES: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
  { value: 'dark',   label: 'Oscuro',  icon: Moon },
  { value: 'light',  label: 'Claro',   icon: Sun },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

export default function AppearancePage() {
  const theme = useSettingsStore(state => state.theme)
  const showNsfw = useSettingsStore(state => state.showNsfw)
  const setSettings = useSettingsStore(state => state.setSettings)
  const { toast } = useToast()
  const [saving, setSaving] = React.useState(false)
  const [showNsfwConfirm, setShowNsfwConfirm] = React.useState(false)

  // useTheme applies the class reactively to <html>
  useTheme()

  const handleThemeChange = async (newTheme: ThemeMode) => {
    setSettings({ theme: newTheme })
    await saveSettings({ theme: newTheme })
  }

  const handleNsfwToggle = (checked: boolean) => {
    if (checked) {
      setShowNsfwConfirm(true)
    } else {
      applyNsfw(false)
    }
  }

  const applyNsfw = async (value: boolean) => {
    setSettings({ showNsfw: value })
    setShowNsfwConfirm(false)
    await saveSettings({ show_nsfw: value })
  }

  const saveSettings = async (patch: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast('Preferencias guardadas.', 'success')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error al guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl pb-10">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Apariencia</h1>
        <p className="text-text-secondary mt-1">Personaliza la interfaz visual de Kami Prompter.</p>
      </div>

      <div className="grid gap-6">
        {/* Theme selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tema visual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {THEMES.map(t => {
                const Icon = t.icon
                const isActive = theme === t.value
                return (
                  <button
                    key={t.value}
                    onClick={() => handleThemeChange(t.value)}
                    disabled={saving}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all flex-1',
                      isActive
                        ? 'border-accent bg-accent-subtle text-accent'
                        : 'border-border bg-surface hover:bg-surface-raised hover:border-border-strong text-text-secondary'
                    )}
                    aria-pressed={isActive}
                    aria-label={`Tema ${t.label}`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* NSFW toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtro de contenido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {showNsfw ? <Eye size={18} className="text-warning" /> : <EyeOff size={18} className="text-text-muted" />}
                <div>
                  <p className="text-sm font-medium text-text-primary">Mostrar contenido sensible</p>
                  <p className="text-xs text-text-secondary mt-0.5">Muestra contenido NSFW en la biblioteca de plantillas.</p>
                </div>
              </div>
              <Switch
                checked={showNsfw ?? false}
                onChange={handleNsfwToggle}
                disabled={saving}
                label="Mostrar contenido sensible"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NSFW confirmation modal */}
      <Modal
        isOpen={showNsfwConfirm}
        onClose={() => setShowNsfwConfirm(false)}
        title="Confirmar contenido sensible"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Estás a punto de habilitar la visualización de contenido NSFW (Not Safe For Work) en la biblioteca de plantillas. ¿Confirmas que tienes más de 18 años y que estás de acuerdo?
          </p>
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => applyNsfw(true)} className="flex-1">
              Confirmar
            </Button>
            <Button variant="outline" onClick={() => setShowNsfwConfirm(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
