'use client'
import * as React from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface TagInputProps {
  tags: Array<{ tag: string; created_by: 'user' | 'ai' }>
  onChange: (tags: Array<{ tag: string; created_by: 'user' | 'ai' }>) => void
  templateName?: string
  promptContent?: string
  disabled?: boolean
}

export function TagInput({ tags, onChange, templateName, promptContent, disabled }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('')
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false)
  const inputId = React.useId()

  const addTag = (tag: string, createdBy: 'user' | 'ai' = 'user') => {
    const normalized = tag.toLowerCase().replace(/\s+/g, '-').trim()
    if (!normalized || tags.some(t => t.tag === normalized)) return
    onChange([...tags, { tag: normalized, created_by: createdBy }])
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t.tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue.trim())
      setInputValue('')
    }
  }

  const handleSuggest = async () => {
    if (!templateName && !promptContent) return
    setLoadingSuggestions(true)
    setSuggestions([])
    try {
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: templateName ?? '',
          promptContent: promptContent ?? '',
          existingTags: tags.map(t => t.tag),
        }),
      })
      if (res.ok) {
        const { data } = await res.json() as { data: { suggestedTags: string[] } }
        setSuggestions(data.suggestedTags.filter(s => !tags.some(t => t.tag === s)))
      }
    } catch { /* ignore */ }
    finally { setLoadingSuggestions(false) }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Tag chips */}
      <div className="flex flex-wrap gap-1.5 min-h-7">
        <AnimatePresence mode="popLayout">
          {tags.map(t => (
            <motion.span
              key={t.tag}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                t.created_by === 'ai'
                  ? 'bg-accent-subtle text-accent border-accent-border'
                  : 'bg-surface-raised text-text-primary border-border'
              )}
            >
              {t.tag}
              {!disabled && (
                <button
                  onClick={() => removeTag(t.tag)}
                  className="text-text-muted hover:text-error transition-colors"
                  aria-label={`Quitar tag ${t.tag}`}
                >
                  <X size={10} />
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">Añadir tag</label>
        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Añadir tag... (Enter o coma)"
          disabled={disabled}
          className="flex-1 h-8 px-3 text-xs rounded-md bg-surface border border-border text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50"
        />
        {(templateName || promptContent) && (
          <Button variant="ghost" size="sm" onClick={handleSuggest} disabled={loadingSuggestions || disabled} className="gap-1.5 shrink-0">
            {loadingSuggestions ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Sugerir
          </Button>
        )}
      </div>

      {/* AI suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-1.5"
          >
            <span className="text-xs text-text-muted self-center">Sugerencias IA:</span>
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => { addTag(s, 'ai'); setSuggestions(prev => prev.filter(x => x !== s)) }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-dashed border-accent-border text-accent hover:bg-accent-subtle transition-colors"
              >
                + {s}
              </button>
            ))}
            <button onClick={() => setSuggestions([])} className="text-xs text-text-muted hover:text-error ml-1">
              Descartar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
