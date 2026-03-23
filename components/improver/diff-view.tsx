'use client'
import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Copy, Check, ChevronDown, ChevronUp, Plus, Minus, RefreshCw } from 'lucide-react'
import { parseDiff } from '@/lib/utils/diff-parser'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ChangeAnnotation } from '@/types'

interface DiffViewProps {
  original: string
  improved: string
  changes: ChangeAnnotation[]
}

const typeConfig: Record<ChangeAnnotation['type'], { label: string; variant: 'success' | 'error' | 'warning' }> = {
  addition:    { label: 'Adición',         variant: 'success' },
  removal:     { label: 'Eliminación',     variant: 'error' },
  restructure: { label: 'Reestructura',    variant: 'warning' },
}

export function DiffView({ original, improved, changes }: DiffViewProps) {
  const [showChanges, setShowChanges] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<'diff' | 'original' | 'improved'>('diff')
  const [copied, setCopied] = React.useState(false)

  const segments = React.useMemo(() => parseDiff(original, improved), [original, improved])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(improved)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0 px-1">
        <div className="flex gap-1 p-1 rounded-md bg-surface-raised">
          {(['diff', 'original', 'improved'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-sm transition-colors capitalize',
                activeTab === tab
                  ? 'bg-surface-overlay text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {tab === 'diff' ? 'Diferencias' : tab === 'original' ? 'Original' : 'Mejorado'}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? <Check size={14} className="mr-1.5 text-(--color-success)" /> : <Copy size={14} className="mr-1.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto rounded-lg bg-(--color-bg) p-5 min-h-0">
        {activeTab === 'diff' && (
          <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
            {segments.map((seg, i) => (
              <span
                key={i}
                className={cn(
                  'transition-colors',
                  seg.type === 'added' && 'bg-diff-added border-b-2 border-diff-added-border text-diff-added-text',
                  seg.type === 'removed' && 'bg-diff-removed border-b-2 border-diff-removed-border text-diff-removed-text line-through opacity-60',
                  seg.type === 'restructured' && 'bg-diff-restructured border-b-2 border-diff-restructured-border text-diff-restructured-text',
                )}
              >
                {seg.text}
              </span>
            ))}
          </div>
        )}
        {activeTab === 'original' && (
          <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-text-secondary">
            {original}
          </div>
        )}
        {activeTab === 'improved' && (
          <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-text-primary">
            {improved}
          </div>
        )}
      </div>

      {/* Changes List */}
      {changes.length > 0 && (
        <div className="shrink-0">
          <button
            onClick={() => setShowChanges(v => !v)}
            className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            {showChanges ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {changes.length} {changes.length === 1 ? 'cambio' : 'cambios'} aplicados
          </button>
          <AnimatePresence initial={false}>
            {showChanges && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2">
                  {changes.map((change, i) => {
                    const config = typeConfig[change.type]
                    const Icon = change.type === 'addition' ? Plus : change.type === 'removal' ? Minus : RefreshCw
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-md bg-surface-raised border border-border"
                      >
                        <div className="shrink-0 mt-0.5">
                          <Icon size={13} className={cn(
                            config.variant === 'success' && 'text-(--color-success)',
                            config.variant === 'error' && 'text-error',
                            config.variant === 'warning' && 'text-(--color-warning)',
                          )} />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-primary">{change.vector}</span>
                            <Badge variant={config.variant} size="sm">{config.label}</Badge>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">{change.description}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
