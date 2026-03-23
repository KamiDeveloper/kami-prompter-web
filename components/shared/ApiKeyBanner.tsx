'use client'
import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useSettingsStore } from '@/lib/store/settings.store'
import { cn } from '@/lib/utils/cn'

export function ApiKeyBanner({ className }: { className?: string }) {
  const [dismissed, setDismissed] = React.useState(false)
  const apiKeyStatus = useSettingsStore(state => state.apiKeyStatus)

  const hasIssue =
    apiKeyStatus.flash === 'not_configured' ||
    apiKeyStatus.flash === 'invalid' ||
    apiKeyStatus.pro === 'not_configured' ||
    apiKeyStatus.pro === 'invalid'

  if (!hasIssue || dismissed) return null

  const missingKeys: string[] = []
  if (apiKeyStatus.flash === 'not_configured' || apiKeyStatus.flash === 'invalid')
    missingKeys.push('Gemini Flash')
  if (apiKeyStatus.pro === 'not_configured' || apiKeyStatus.pro === 'invalid')
    missingKeys.push('Gemini Pro')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex items-center gap-3 rounded-xl border border-warning/20 bg-warning-subtle px-4 py-3 text-sm',
          className
        )}
      >
        <AlertTriangle size={15} className="text-warning shrink-0" />
        <span className="flex-1 text-text-primary">
          {missingKeys.join(' y ')} {missingKeys.length > 1 ? 'no tienen' : 'no tiene'} API Key configurada.{' '}
          <Link href="/app/settings/api-keys" className="font-medium text-accent underline-offset-2 hover:underline">
            Configurar ahora →
          </Link>
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-text-muted hover:text-text-primary transition-colors p-0.5 rounded"
          aria-label="Cerrar banner de API Key"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
