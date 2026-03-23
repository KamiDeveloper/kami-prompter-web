'use client'
import * as React from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, Zap, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ModelKey } from '@/types'
import { useSettingsStore } from '@/lib/store/settings.store'
import { Tooltip } from './tooltip'

interface ModelSelectorProps {
  value: ModelKey
  onChange: (model: ModelKey) => void
  disabled?: boolean
}

export function ModelSelector({ value, onChange, disabled = false }: ModelSelectorProps) {
  const defaultId = React.useId()
  const apiKeyStatus = useSettingsStore(state => state.apiKeyStatus)

  const models: Array<{ key: ModelKey; label: string; icon: React.ElementType }> = [
    { key: 'flash', label: 'Flash', icon: Zap },
    { key: 'pro',   label: 'Pro',   icon: Cpu },
  ]

  return (
    <div className={cn("inline-flex items-center gap-1 p-1 bg-surface border border-border rounded-md", disabled && "opacity-50 pointer-events-none")}>
      {models.map((model) => {
        const isActive = value === model.key
        const isNotConfigured = apiKeyStatus[model.key] === 'not_configured' || apiKeyStatus[model.key] === 'invalid'

        const content = (
          <button
            key={model.key}
            onClick={() => onChange(model.key)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 h-8 px-3 rounded-sm text-sm font-medium transition-colors outline-none",
              isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={`model-bg-${defaultId}`}
                className="absolute inset-0 bg-surface-raised border border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <model.icon size={12} className="shrink-0" />
              {model.label}
              {isNotConfigured && (
                <AlertTriangle size={12} className="text-(--color-warning)" />
              )}
            </span>
          </button>
        )

        if (isNotConfigured) {
          return (
            <Tooltip key={model.key} content={`API Key no configurada. Configura en Settings.`} position="top">
              {content}
            </Tooltip>
          )
        }
        return <React.Fragment key={model.key}>{content}</React.Fragment>
      })}
    </div>
  )
}
