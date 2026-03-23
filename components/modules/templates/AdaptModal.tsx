'use client'
import * as React from 'react'
import { Loader2, Sparkles, Copy, Check, GitBranch } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ThinkingLevelSelector } from '@/components/ui/thinking-level-selector'
import { useToast } from '@/hooks/use-toast'
import type { ThinkingLevelKey } from '@/types'

interface AdaptModalProps {
  isOpen: boolean
  onClose: () => void
  originalPrompt: string
  onSaveAsBranch?: (adaptedPrompt: string) => void
}

export function AdaptModal({ isOpen, onClose, originalPrompt, onSaveAsBranch }: AdaptModalProps) {
  const [context, setContext] = React.useState('')
  const [thinkingLevel, setThinkingLevel] = React.useState<ThinkingLevelKey>('MEDIUM')
  const [loading, setLoading] = React.useState(false)
  const [adapted, setAdapted] = React.useState<{ adaptedPrompt: string; changes: string[] } | null>(null)
  const [copied, setCopied] = React.useState(false)
  const { toast } = useToast()

  const handleAdapt = async () => {
    if (!context.trim()) { toast('Describe el contexto de uso.', 'warning'); return }
    setLoading(true)
    setAdapted(null)
    try {
      const res = await fetch('/api/ai/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalPrompt, userContext: context, model: 'flash', thinkingLevel }),
      })
      if (!res.ok) throw new Error('Error al adaptar el prompt')
      const { data } = await res.json() as { data: { adaptedPrompt: string; changes: string[] } }
      setAdapted(data)
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error al adaptar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!adapted) return
    await navigator.clipboard.writeText(adapted.adaptedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleClose = () => {
    setContext('')
    setAdapted(null)
    setLoading(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adaptar plantilla con IA">
      <div className="flex flex-col gap-4">
        <Textarea
          label="Describe el contexto específico de este uso"
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Ej: Quiero usar este prompt para documentar una API en FastAPI en lugar de Node.js, enfocado en desarrolladores de Python..."
          disabled={loading || !!adapted}
          autoResize
          maxRows={6}
        />

        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary shrink-0">Thinking:</span>
          <ThinkingLevelSelector value={thinkingLevel} onChange={setThinkingLevel} disabled={loading || !!adapted} />
        </div>

        {!adapted && (
          <Button onClick={handleAdapt} disabled={loading || !context.trim()} className="w-full">
            {loading
              ? <><Loader2 size={15} className="animate-spin mr-1.5" /> Adaptando...</>
              : <><Sparkles size={15} className="mr-1.5" /> Adaptar</>}
          </Button>
        )}

        {adapted && (
          <div className="flex flex-col gap-3 rounded-xl bg-surface p-4 border border-border">
            <p className="text-sm font-medium text-text-primary">Prompt adaptado:</p>
            <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap leading-relaxed max-h-48 overflow-auto">
              {adapted.adaptedPrompt}
            </pre>
            {adapted.changes.length > 0 && (
              <ul className="text-xs text-text-muted space-y-0.5">
                {adapted.changes.map((c, i) => <li key={i}>&middot; {c}</li>)}
              </ul>
            )}
            <div className="flex gap-2 mt-1">
              <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={copied ? 'Copiado' : 'Copiar prompt adaptado'}>
                {copied ? <Check size={13} className="mr-1.5 text-success" /> : <Copy size={13} className="mr-1.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
              {onSaveAsBranch && (
                <Button variant="secondary" size="sm" onClick={() => onSaveAsBranch(adapted.adaptedPrompt)}>
                  <GitBranch size={13} className="mr-1.5" />
                  Guardar como rama
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setAdapted(null)}>
                Nueva adaptación
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
