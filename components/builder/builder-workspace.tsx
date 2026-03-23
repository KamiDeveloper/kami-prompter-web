'use client'
import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Blocks, Loader2, Sparkles, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ThinkingLevelSelector } from '@/components/ui/thinking-level-selector'
import { ModelSelector } from '@/components/ui/model-selector'
import { useBuild } from '@/hooks/use-build'
import { useSettingsStore } from '@/lib/store/settings.store'
import type { ModelKey, ThinkingLevelKey, BuildRequest } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils/cn'
import { estimateTokens, formatTokenCount } from '@/lib/utils/token-counter'

type CredoField = keyof BuildRequest['credo']

interface CredoBlockConfig {
  field: CredoField
  letter: string
  label: string
  subtitle: string
  placeholder: string
  color: string
}

const credoBlocks: CredoBlockConfig[] = [
  {
    field: 'context',
    letter: 'C',
    label: 'Contexto',
    subtitle: 'Situación y antecedentes',
    placeholder: 'Ej: Estoy desarrollando una API REST en FastAPI...',
    color: 'var(--color-credo-c)',
  },
  {
    field: 'role',
    letter: 'R',
    label: 'Rol',
    subtitle: 'Expertise que adopta el modelo',
    placeholder: 'Ej: Actúa como un senior backend developer con experiencia en Python...',
    color: 'var(--color-credo-r)',
  },
  {
    field: 'expectation',
    letter: 'E',
    label: 'Especificación',
    subtitle: 'Qué debe producir',
    placeholder: 'Ej: Genera el código completo del endpoint incluyendo validaciones...',
    color: 'var(--color-credo-e)',
  },
  {
    field: 'data',
    letter: 'D',
    label: 'Datos',
    subtitle: 'Información de entrada',
    placeholder: 'Ej: El schema de la base de datos es el siguiente: ...',
    color: 'var(--color-credo-d)',
  },
  {
    field: 'outputFormat',
    letter: 'O',
    label: 'Output',
    subtitle: 'Formato de respuesta',
    placeholder: 'Ej: Responde en código Python con comentarios. Máximo 100 líneas.',
    color: 'var(--color-credo-o)',
  },
]

export function BuilderWorkspace() {
  const [credo, setCredo] = React.useState<BuildRequest['credo']>({
    context: '',
    role: '',
    expectation: '',
    data: '',
    outputFormat: '',
  })
  const [thinkingLevel, setThinkingLevel] = React.useState<ThinkingLevelKey>('MEDIUM')
  const [model, setModel] = React.useState<ModelKey>('flash')
  const [suggestingField, setSuggestingField] = React.useState<CredoField | null>(null)
  const [suggestion, setSuggestion] = React.useState<{ field: CredoField; text: string; explanation: string } | null>(null)
  const [copied, setCopied] = React.useState(false)

  const { build, suggestField, loading, data, reset } = useBuild()
  const { toast } = useToast()
  const defaultThinkingLevel = useSettingsStore(state => state.defaultThinkingLevel)
  const defaultModel = useSettingsStore(state => state.defaultModel)

  React.useEffect(() => {
    setThinkingLevel(defaultThinkingLevel ?? 'MEDIUM')
    setModel(defaultModel ?? 'flash')
  }, [defaultThinkingLevel, defaultModel])

  const totalChars = Object.values(credo).join('').length
  const hasContent = Object.values(credo).some(v => v && v.trim())

  const handleBuild = async () => {
    if (!hasContent) {
      toast('Completa al menos un bloque CREDO.', 'warning')
      return
    }
    try {
      await build(credo, thinkingLevel, model)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al construir el prompt.'
      toast(msg, 'error')
    }
  }

  const handleSuggest = async (field: CredoField) => {
    setSuggestingField(field)
    try {
      const result = await suggestField(field, credo, thinkingLevel, model)
      setSuggestion({ field, text: result.suggestion, explanation: result.explanation })
    } catch {
      toast('Error al generar sugerencia.', 'error')
    } finally {
      setSuggestingField(null)
    }
  }

  const handleAcceptSuggestion = () => {
    if (!suggestion) return
    setCredo(prev => ({ ...prev, [suggestion.field]: suggestion.text }))
    setSuggestion(null)
  }

  const handleCopy = async () => {
    const text = data?.refinedPrompt ?? data?.assembledPrompt ?? ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Progress dots
  const filledCount = credoBlocks.filter(b => (credo[b.field] ?? '').trim().length > 0).length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 w-full min-h-[calc(100vh-6rem)]">
      {/* CREDO Form */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-xl font-semibold tracking-tight">Prompt Builder</h2>
          <div className="flex items-center gap-2">
            <ModelSelector value={model} onChange={setModel} disabled={loading} />
            <ThinkingLevelSelector value={thinkingLevel} onChange={setThinkingLevel} compact disabled={loading} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {credoBlocks.map(block => {
            const value = credo[block.field] ?? ''
            const isCompleted = value.trim().length > 0
            const isSuggesting = suggestingField === block.field
            const hasSuggestion = suggestion?.field === block.field

            return (
              <div
                key={block.field}
                className="rounded-lg border border-border bg-surface overflow-hidden transition-shadow hover:border-border-strong"
              >
                {/* Block Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-raised">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs font-bold text-white"
                      style={{ backgroundColor: block.color, boxShadow: isCompleted ? `0 0 0 2px ${block.color}40` : undefined }}
                    >
                      {block.letter}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-text-primary">{block.label}</span>
                      <span className="ml-2 text-xs text-text-muted">{block.subtitle}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuggest(block.field)}
                    disabled={isSuggesting || loading}
                    className="text-xs h-7 px-2"
                  >
                    {isSuggesting
                      ? <Loader2 size={12} className="animate-spin mr-1" />
                      : <Sparkles size={12} className="mr-1 text-accent" />}
                    Sugerir
                  </Button>
                </div>

                {/* Textarea */}
                <div className="p-3">
                  <Textarea
                    value={value}
                    onChange={e => setCredo(prev => ({ ...prev, [block.field]: e.target.value }))}
                    placeholder={block.placeholder}
                    className="min-h-20 resize-none text-sm"
                    disabled={loading}
                    fontMono={false}
                    autoResize
                    maxRows={8}
                  />
                </div>

                {/* Suggestion Card */}
                <AnimatePresence>
                  {hasSuggestion && suggestion && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border bg-surface-raised p-3"
                    >
                      <p className="text-xs font-medium text-text-muted mb-1">Sugerencia de IA</p>
                      <p className="text-xs font-mono text-text-secondary mb-1 leading-relaxed">{suggestion.text}</p>
                      {suggestion.explanation && (
                        <p className="text-[10px] text-text-muted mb-2">{suggestion.explanation}</p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={handleAcceptSuggestion} className="h-6 px-2 text-xs">
                          <Check size={11} className="mr-1" /> Aceptar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)} className="h-6 px-2 text-xs">
                          Rechazar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        <Button onClick={handleBuild} disabled={loading || !hasContent} size="lg" className="w-full">
          {loading
            ? <><Loader2 size={16} className="mr-2 animate-spin" />Construyendo prompt...</>
            : <><Sparkles size={16} className="mr-2" />Pulir con IA</>}
        </Button>
      </div>

      {/* Preview Panel */}
      <div className="flex flex-col gap-4 sticky top-6 self-start">
        {/* Progress */}
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-4">
          <div className="flex gap-1.5">
            {credoBlocks.map(block => (
              <div
                key={block.field}
                title={block.label}
                className="w-7 h-7 rounded-sm flex items-center justify-center text-[10px] font-bold text-white transition-all"
                style={{
                  backgroundColor: (credo[block.field] ?? '').trim() ? block.color : 'var(--color-border)',
                  color: (credo[block.field] ?? '').trim() ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                {block.letter}
              </div>
            ))}
          </div>
          <span className="text-xs text-text-muted ml-1">{filledCount}/5 bloques</span>
          <span className="ml-auto text-xs text-text-muted">{formatTokenCount(estimateTokens(Object.values(credo).join(' ')))} tokens</span>
        </div>

        {/* Preview Content */}
        <div className="flex flex-col gap-0 rounded-lg border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-raised">
            <span className="text-xs font-medium text-text-secondary">Preview del prompt</span>
            {data && (
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2 text-xs">
                {copied ? <Check size={11} className="mr-1 text-(--color-success)" /> : <Copy size={11} className="mr-1" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            )}
          </div>

          <div className="p-4 max-h-[60vh] overflow-auto">
            {data ? (
              <div className="font-mono text-xs leading-relaxed text-text-primary whitespace-pre-wrap">
                {data.refinedPrompt || data.assembledPrompt}
              </div>
            ) : hasContent ? (
              // Live preview of assembled CREDO
              <div className="space-y-2">
                {credoBlocks.map(block => {
                  const val = credo[block.field] ?? ''
                  if (!val.trim()) return null
                  return (
                    <div key={block.field} className="flex gap-2">
                      <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: block.color }} />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: block.color }}>{block.label}</p>
                        <p className="font-mono text-xs text-text-secondary leading-relaxed">{val}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Blocks size={24} className="text-text-muted mb-2" />
                <p className="text-xs text-text-muted">Completa los bloques CREDO para ver el preview</p>
              </div>
            )}
          </div>
        </div>

        {data && (
          <Button variant="ghost" size="sm" onClick={reset} className="text-xs">
            <Blocks size={13} className="mr-1.5" /> Nueva construcción
          </Button>
        )}
      </div>
    </div>
  )
}
