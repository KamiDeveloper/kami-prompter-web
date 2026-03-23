'use client'
import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Wand2, Loader2, Copy, Check, RotateCcw } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ThinkingLevelSelector } from '@/components/ui/thinking-level-selector'
import { ModelSelector } from '@/components/ui/model-selector'
import { useImprove } from '@/hooks/use-improve'
import { useSettingsStore } from '@/lib/store/settings.store'
import type { ModelKey, ThinkingLevelKey } from '@/types'
import { DiffView } from './diff-view'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils/cn'

type InterventionLevel = 'subtle' | 'moderate' | 'aggressive'

const interventionOptions: { key: InterventionLevel; label: string; description: string }[] = [
  { key: 'subtle',     label: 'Sutil',     description: 'Preserva tu voz' },
  { key: 'moderate',   label: 'Moderado',  description: 'Mejora estructural' },
  { key: 'aggressive', label: 'Agresivo',  description: 'Reescritura profunda' },
]

export function ImproverWorkspace() {
  const [prompt, setPrompt] = React.useState('')
  const [interventionLevel, setInterventionLevel] = React.useState<InterventionLevel>('moderate')
  const [thinkingLevel, setThinkingLevel] = React.useState<ThinkingLevelKey>('MEDIUM')
  const [model, setModel] = React.useState<ModelKey>('flash')

  const { improve, loading, data, reset } = useImprove()
  const { toast } = useToast()
  const defaultThinkingLevel = useSettingsStore(state => state.defaultThinkingLevel)
  const defaultModel = useSettingsStore(state => state.defaultModel)

  React.useEffect(() => {
    setThinkingLevel(defaultThinkingLevel ?? 'MEDIUM')
    setModel(defaultModel ?? 'flash')
  }, [defaultThinkingLevel, defaultModel])

  const handleImprove = async () => {
    if (!prompt.trim()) {
      toast('El prompt no puede estar vacío.', 'warning')
      return
    }
    try {
      await improve(prompt, interventionLevel, thinkingLevel, model)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al mejorar el prompt.'
      if (msg.includes('API_KEY_NOT_CONFIGURED') || msg.includes('flash') || msg.includes('pro')) {
        toast('API Key no configurada. Ve a Configuración para añadirla.', 'error')
      } else {
        toast(msg, 'error')
      }
    }
  }

  // Ctrl/Cmd+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleImprove()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full h-[calc(100vh-6rem)] md:h-[calc(100vh-5rem)]">
      {/* Input Column */}
      <div className="flex flex-col gap-4 h-full min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-xl font-semibold tracking-tight">Prompt Improver</h2>
          <div className="flex items-center gap-2">
            <ModelSelector value={model} onChange={setModel} disabled={loading} />
            <ThinkingLevelSelector value={thinkingLevel} onChange={setThinkingLevel} compact disabled={loading} />
          </div>
        </div>

        {/* Intervention Level */}
        <div className="flex gap-1 p-1 rounded-md bg-surface-raised w-fit shrink-0">
          {interventionOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setInterventionLevel(opt.key)}
              disabled={loading}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-sm transition-all',
                interventionLevel === opt.key
                  ? 'bg-accent-subtle text-accent-light border border-accent-border'
                  : 'text-text-muted hover:text-text-secondary',
                loading && 'opacity-50 cursor-not-allowed'
              )}
              title={opt.description}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Card padding="md" className="flex-1 flex flex-col gap-3 min-h-0 bg-surface border-border overflow-hidden p-5 rounded-xl">
          {/* Loading overlay on textarea */}
          <div className="flex-1 relative flex flex-col min-h-0">
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe o pega tu prompt aquí..."
              className="flex-1 resize-none h-full font-mono"
              disabled={loading}
              showCount
              fontMono
            />
            {loading && (
              <div className="absolute inset-0 bg-surface/70 backdrop-blur-[2px] rounded-lg flex flex-col items-center justify-center gap-3">
                {/* Scanning line */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-accent to-transparent"
                  animate={{ y: ['0%', '4000%'] }}
                  transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                />
                <Loader2 className="animate-spin text-accent" size={22} />
                <p className="text-sm font-medium text-text-primary">Analizando con IA...</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between shrink-0">
            <p className="text-xs text-text-muted">
              <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-surface-raised border border-border">Ctrl</kbd>
              {' '}+{' '}
              <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-surface-raised border border-border">Enter</kbd>
              {' '}para mejorar
            </p>
            {data && (
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw size={13} className="mr-1.5" />
                Limpiar
              </Button>
            )}
          </div>

          <Button
            onClick={handleImprove}
            disabled={loading || !prompt.trim()}
            className="w-full shrink-0"
            size="lg"
          >
            <AnimatePresence mode="wait" initial={false}>
              {loading ? (
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Analizando...
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Wand2 size={16} /> Mejorar prompt
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </Card>
      </div>

      {/* Result Column */}
      <div className="flex flex-col gap-4 h-full min-h-0 border-t lg:border-t-0 pt-6 lg:pt-0 border-border">
        <h2 className="text-xl font-semibold tracking-tight shrink-0 invisible hidden lg:block">Resultado</h2>

        <AnimatePresence mode="wait">
          {!data && !loading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center p-8 bg-surface-raised/40"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent-subtle flex items-center justify-center mb-4 text-accent">
                <Wand2 size={26} />
              </div>
              <h3 className="text-base font-semibold mb-2">Mejora tu primer prompt</h3>
              <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
                Escribe un prompt a la izquierda, selecciona el nivel de intervención y haz clic en &ldquo;Mejorar prompt&rdquo;.
              </p>
            </motion.div>
          )}

          {data && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col overflow-hidden bg-surface border border-border rounded-xl min-h-0"
            >
              <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4 shrink-0 px-5 pt-5">
                <CardTitle className="text-base">Prompt Mejorado</CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-sm bg-diff-added-border" /> Añadido
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-sm bg-diff-removed-border" /> Eliminado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-sm bg-diff-restructured-border" /> Reestructurado
                    </span>
                  </div>
                </div>
              </CardHeader>
              <div className="flex-1 overflow-auto p-5 min-h-0">
                <DiffView
                  original={data.originalPrompt}
                  improved={data.improvedPrompt}
                  changes={data.changes}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
