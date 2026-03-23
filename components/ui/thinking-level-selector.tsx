'use client'
import * as React from 'react'
import { motion } from 'motion/react'
import { Zap, Scale, Brain } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ThinkingLevelKey } from '@/types'

interface ThinkingLevelSelectorProps {
  value: ThinkingLevelKey
  onChange: (level: ThinkingLevelKey) => void
  compact?: boolean
  disabled?: boolean
  moduleContext?: string // e.g. "improver", "prd"
}

const levelsCode = {
  LOW: { label: 'Rápido', icon: Zap, description: 'Mínima latencia. Ideal para sugerencias y tareas simples.' },
  MEDIUM: { label: 'Balanceado', icon: Scale, description: 'Equilibrio entre velocidad y razonamiento. Recomendado para la mayoría de tareas.' },
  HIGH: { label: 'Profundo', icon: Brain, description: 'Máximo razonamiento. Recomendado para PRDs y mejoras complejas.' },
}

const levels = Object.entries(levelsCode).map(([key, config]) => ({
  key: key as ThinkingLevelKey,
  label: config.label,
  icon: config.icon,
  description: config.description
}))

export function ThinkingLevelSelector({ value, onChange, compact = false, disabled = false, moduleContext }: ThinkingLevelSelectorProps) {
  // layoutId needs to be unique if there are multiple selectors on screen
  const defaultId = React.useId()

  return (
    <div className={cn("inline-flex items-center gap-1 p-1 bg-surface border border-border rounded-md", disabled && "opacity-50 pointer-events-none")}>
      {levels.map((level) => {
        const Icon = level.icon
        const isActive = value === level.key

        return (
          <button
            key={level.key}
            onClick={() => onChange(level.key)}
            title={compact ? level.label : undefined}
            className={cn(
              "relative flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-sm text-sm font-medium transition-colors outline-none",
              isActive ? "text-accent" : "text-text-secondary hover:text-text-primary",
              compact && "w-8 px-0"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={`thinking-bg-${defaultId}`}
                className="absolute inset-0 bg-accent-subtle border border-accent-border rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <Icon size={14} />
              {!compact && <span>{level.label}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
