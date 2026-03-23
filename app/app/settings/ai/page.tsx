'use client'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/lib/store/settings.store'
import { ThinkingLevelSelector } from '@/components/ui/thinking-level-selector'
import { ModelSelector } from '@/components/ui/model-selector'
import { useToast } from '@/hooks/use-toast'
import { Brain, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ThinkingLevelKey, ModelKey } from '@/types'

type PrdDetail = 'basic' | 'standard' | 'exhaustive'
type PrdLanguage = 'auto' | 'es' | 'en' | 'pt'

const PRD_DETAIL_LEVELS: Array<{ value: PrdDetail; label: string; description: string }> = [
  { value: 'basic',      label: 'Básico',      description: 'Estructura esencial, máx. 1000 tokens.' },
  { value: 'standard',   label: 'Estándar',    description: 'Detalle completo, casos de uso y métricas.' },
  { value: 'exhaustive', label: 'Exhaustivo',  description: 'Análisis profundo con alternativas técnicas.' },
]

const PRD_LANGUAGES: Array<{ value: PrdLanguage; label: string }> = [
  { value: 'auto',       label: 'Auto (detectar)' },
  { value: 'es',         label: 'Español' },
  { value: 'en',         label: 'English' },
  { value: 'pt',         label: 'Português' },
]

export default function AISettingsPage() {
  const defaultModel = useSettingsStore(state => state.defaultModel)
  const defaultThinkingLevel = useSettingsStore(state => state.defaultThinkingLevel)
  const prdDefaultDetail = useSettingsStore(state => state.prdDefaultDetail)
  const prdDefaultLanguage = useSettingsStore(state => state.prdDefaultLanguage)
  const setSettings = useSettingsStore(state => state.setSettings)
  const { toast } = useToast()
  const [saving, setSaving] = React.useState(false)

  const [model, setModel] = React.useState<ModelKey>(defaultModel ?? 'flash')
  const [thinkingLevel, setThinkingLevel] = React.useState<ThinkingLevelKey>(defaultThinkingLevel ?? 'MEDIUM')
  const [prdDetail, setPrdDetail] = React.useState<PrdDetail>(prdDefaultDetail ?? 'standard')
  const [prdLang, setPrdLang] = React.useState<PrdLanguage>(prdDefaultLanguage ?? 'auto')

  const handleSave = async () => {
    setSaving(true)
    setSettings({
      defaultModel: model,
      defaultThinkingLevel: thinkingLevel,
      prdDefaultDetail: prdDetail,
      prdDefaultLanguage: prdLang,
    })
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_model: model,
          default_thinking_level: thinkingLevel,
          prd_default_detail: prdDetail,
          prd_default_language: prdLang,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast('Preferencias de IA guardadas.', 'success')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error al guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl pb-10">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Preferencias de IA</h1>
        <p className="text-text-secondary mt-1">Configura el comportamiento por defecto de los módulos de IA.</p>
      </div>

      <div className="grid gap-6">
        {/* Model & thinking defaults */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-accent" />
              <CardTitle className="text-base">Modelo y nivel de razonamiento</CardTitle>
            </div>
            <CardDescription>Defaults usados cuando abres un módulo nuevo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-secondary w-28 shrink-0">Modelo por defecto</span>
              <ModelSelector value={model} onChange={setModel} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-secondary w-28 shrink-0">Thinking level</span>
              <ThinkingLevelSelector value={thinkingLevel} onChange={setThinkingLevel} />
            </div>
          </CardContent>
        </Card>

        {/* PRD preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">PRD Maker</CardTitle>
            <CardDescription>Preferencias para la generación de documentos PRD.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium text-text-primary mb-3">Nivel de detalle por defecto</p>
              <div className="grid grid-cols-3 gap-2">
                {PRD_DETAIL_LEVELS.map(level => (
                  <button
                    key={level.value}
                    onClick={() => setPrdDetail(level.value)}
                    className={cn(
                      'flex flex-col gap-1 p-3 rounded-lg border text-left transition-all',
                      prdDetail === level.value
                        ? 'border-accent bg-accent-subtle text-accent'
                        : 'border-border bg-surface hover:bg-surface-raised text-text-secondary'
                    )}
                    aria-pressed={prdDetail === level.value}
                    aria-label={`Nivel de detalle: ${level.label}`}
                  >
                    <span className="text-xs font-semibold">{level.label}</span>
                    <span className="text-[10px] leading-tight opacity-70">{level.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-text-primary mb-3">Idioma de output</p>
              <div className="flex flex-wrap gap-2">
                {PRD_LANGUAGES.map(lang => (
                  <button
                    key={lang.value}
                    onClick={() => setPrdLang(lang.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-md border text-xs font-medium transition-all',
                      prdLang === lang.value
                        ? 'border-accent bg-accent-subtle text-accent'
                        : 'border-border bg-surface hover:bg-surface-raised text-text-secondary'
                    )}
                    aria-pressed={prdLang === lang.value}
                    aria-label={`Idioma: ${lang.label}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 size={15} className="mr-2 animate-spin" /> : null}
        Guardar preferencias
      </Button>
    </div>
  )
}
