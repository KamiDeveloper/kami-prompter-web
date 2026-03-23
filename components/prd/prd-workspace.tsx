'use client'
import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FileText, Loader2, Copy, CheckCircle2, PlaySquare, Square, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ThinkingLevelSelector } from '@/components/ui/thinking-level-selector'
import { ModelSelector } from '@/components/ui/model-selector'
import { usePrdStream } from '@/hooks/use-prd-stream'
import { useSettingsStore } from '@/lib/store/settings.store'
import type { ModelKey, ThinkingLevelKey } from '@/types'
import { useToast } from '@/hooks/use-toast'

export function PrdWorkspace() {
  const [initialIdea, setInitialIdea] = React.useState('')
  const [targetAudience, setTargetAudience] = React.useState('')
  const [purpose, setPurpose] = React.useState('')
  const [thinkingLevel, setThinkingLevel] = React.useState<ThinkingLevelKey>('HIGH')
  const [model, setModel] = React.useState<ModelKey>('pro')
  const [copied, setCopied] = React.useState(false)

  const { generate, content, loading, error, reset } = usePrdStream()
  const { toast } = useToast()
  
  const defaultThinkingLevel = useSettingsStore(state => state.defaultThinkingLevel)
  const defaultModel = useSettingsStore(state => state.defaultModel)

  React.useEffect(() => {
    setThinkingLevel(defaultThinkingLevel === 'LOW' ? 'MEDIUM' : defaultThinkingLevel || 'HIGH')
    setModel(defaultModel || 'pro')
  }, [defaultThinkingLevel, defaultModel])

  const handleGenerate = async () => {
    if (!initialIdea.trim()) {
      toast('La idea inicial no puede estar vacía.', 'warning')
      return
    }

    try {
      await generate({
        description: initialIdea,
        targetAudience: targetAudience || undefined,
        productType: purpose || undefined,
        thinkingLevel,
        model,
      })
      if (!error) toast('Streaming de PRD finalizado.', 'success')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error al generar el PRD.', 'error')
    }
  }

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)]">
      {/* Editor Column */}
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between mb-0 shrink-0">
          <h2 className="text-2xl font-bold tracking-tight">PRD Maker</h2>
          <div className="flex items-center gap-2">
            <ModelSelector value={model} onChange={setModel} disabled={loading} />
            <ThinkingLevelSelector value={thinkingLevel} onChange={setThinkingLevel} compact disabled={loading} />
          </div>
        </div>

        <Card padding="md" className="flex-1 flex flex-col gap-4 min-h-0 bg-surface border-border shadow-sm overflow-hidden p-6 rounded-xl">
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <label className="text-sm font-medium">Concepto / Idea Inicial <span className="text-error">*</span></label>
            <Textarea 
              value={initialIdea} 
              onChange={(e) => setInitialIdea(e.target.value)} 
              placeholder="Describe tu aplicación o feature a alto nivel. Ej: Una app de tareas con IA..." 
              className="flex-1 resize-none h-full"
              disabled={loading}
              showCount
            />
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <label className="text-sm font-medium">Audiencia Objetivo <span className="text-text-secondary font-normal text-xs">(Opcional)</span></label>
            <Input 
              value={targetAudience} 
              onChange={(e) => setTargetAudience(e.target.value)} 
              placeholder="Ej: Estudiantes universitarios, Freelancers..." 
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <label className="text-sm font-medium">Propósito de Negocio <span className="text-text-secondary font-normal text-xs">(Opcional)</span></label>
            <Input 
              value={purpose} 
              onChange={(e) => setPurpose(e.target.value)} 
              placeholder="Ej: Aumentar retención, Monetizar vía freemium..." 
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 w-full shrink-0 mt-2">
            <Button 
              onClick={loading ? reset : handleGenerate} 
              disabled={!loading && !initialIdea.trim()} 
              variant={loading ? "danger" : "primary"}
              className="flex-1" 
              size="lg"
            >
              {loading ? (
                <><Square className="mr-2 h-5 w-5" /> Detener Generación</>
              ) : (
                <><PlaySquare className="mr-2 h-5 w-5" /> Generar PRD</>
              )}
            </Button>
            {!loading && content && (
            <Button onClick={reset} variant="outline" size="lg" className="shrink-0 w-12 p-0" title="Limpiar" aria-label="Limpiar">
                <X size={14} />
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Result Column */}
      <div className="flex flex-col gap-4 h-full relative border-t md:border-none pt-6 md:pt-0 border-border">
        <h2 className="text-2xl font-bold tracking-tight invisible mb-0 hidden md:block shrink-0">Result</h2>
        
        <AnimatePresence mode="wait">
          {!content && !loading && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center p-8 bg-surface-raised/50 min-h-100"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent-subtle flex items-center justify-center mb-4 text-accent">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lienzo en Blanco</h3>
              <p className="text-text-secondary max-w-sm">
                Rellena la información inicial a la izquierda y Kami redactará un PRD profesional completo en tiempo real.
              </p>
            </motion.div>
          )}

          {(loading || content) && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col gap-4 h-full min-h-0"
            >
              <Card className="flex-1 flex flex-col overflow-hidden h-full">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4 shrink-0 px-6 pt-6">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      Documento PRD
                      {loading && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                    </CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopy} disabled={!content}>
                    {copied ? <CheckCircle2 size={16} className="mr-2 text-(--color-success)" /> : <Copy size={16} className="mr-2" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                </CardHeader>
                <div className="flex-1 overflow-auto p-6 bg-(--color-bg) rounded-b-xl font-mono text-sm leading-relaxed text-text-primary">
                  {content ? (
                    <div className="whitespace-pre-wrap">{content}</div>
                  ) : (
                    <div className="flex items-center justify-center h-full opacity-50 space-x-2">
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Inicializando streaming...</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
