'use client'
import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils/cn'
import { fadeIn, shakeError } from '@/lib/animations'
import { estimateTokens, formatTokenCount } from '@/lib/utils/token-counter'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  fontMono?: boolean
  autoResize?: boolean
  maxRows?: number
  showCount?: boolean
  onCmdEnter?: () => void
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { 
      className, 
      label, 
      hint, 
      error, 
      fontMono, 
      autoResize, 
      maxRows = 10,
      showCount,
      onCmdEnter,
      id,
      value,
      onChange,
      ...props 
    },
    ref
  ) => {
    const defaultId = React.useId()
    const textareaId = id ?? defaultId
    const innerRef = React.useRef<HTMLTextAreaElement>(null)

    // Merge refs
    React.useImperativeHandle(ref, () => innerRef.current!)

    const handleInput = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize && innerRef.current) {
        const target = innerRef.current
        target.style.height = 'auto'
        
        // Calculate max height based on line height (approx 24px per line)
        const lineHeight = 24
        const maxHeight = lineHeight * maxRows
        
        const newHeight = Math.min(target.scrollHeight, maxHeight)
        target.style.height = `${newHeight}px`
        
        if (target.scrollHeight > maxHeight) {
          target.style.overflowY = 'auto'
        } else {
          target.style.overflowY = 'hidden'
        }
      }
      if (onChange) {
        onChange(e)
      }
    }, [autoResize, maxRows, onChange])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        onCmdEnter?.()
      }
      props.onKeyDown?.(e)
    }

    const textValue = String(value || props.defaultValue || '')
    const charCount = textValue.length
    const tokenCount = estimateTokens(textValue)

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <motion.div
          animate={error ? 'animate' : 'initial'}
          variants={error ? shakeError : undefined}
          className="relative"
        >
          <textarea
            id={textareaId}
            ref={innerRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className={cn(
              'flex w-full rounded-md border bg-surface px-3 py-2 text-text-primary',
              'transition-colors duration-200 placeholder:text-text-muted',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50 min-h-20',
              fontMono ? 'font-mono text-sm' : 'text-sm',
              autoResize && 'resize-none overflow-hidden',
              showCount && 'pb-8',
              error
                ? 'border-error focus-visible:border-error focus-visible:ring-error-subtle'
                : 'border-border focus-visible:border-accent focus-visible:ring-accent-subtle'
            )}
            {...props}
          />
          {showCount && (
            <div className="absolute bottom-2 right-3 text-xs text-text-muted bg-surface/80 px-1 backdrop-blur-sm rounded">
              {charCount} chars &middot; {formatTokenCount(tokenCount)} tokens
            </div>
          )}
        </motion.div>
        {(hint || error) && (
          <div className="min-h-5 px-1">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key="error"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={fadeIn}
                  className="text-xs text-error"
                >
                  {error}
                </motion.p>
              ) : hint ? (
                <motion.p
                  key="hint"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={fadeIn}
                  className="text-xs text-text-muted mt-1"
                >
                  {hint}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
