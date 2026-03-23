'use client'

import * as React from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ToastMessage } from '@/hooks/use-toast'

interface ToastProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

const typeStyles = {
  success: 'bg-surface border-border text-text-primary',
  error: 'bg-[var(--color-error-subtle)] border-[#ef444433] text-error',
  warning: 'bg-[var(--color-warning-subtle)] border-[#f59e0b33] text-(--color-warning)',
  info: 'bg-surface border-border text-text-primary',
}

const IconMap = {
  // Aplicando sugerencias de Tailwind
  success: <CheckCircle className="text-(--color-success) shrink-0" size={18} />,
  error: <XCircle className="text-error shrink-0" size={18} />,
  warning: <AlertTriangle className="text-(--color-warning) shrink-0" size={18} />,
  info: <Info className="text-(--color-info) shrink-0" size={18} />,
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const shouldReduceMotion = useReducedMotion()

  React.useEffect(() => {
    if (toast.type === 'error') return // persistent

    const duration = toast.type === 'warning' ? 6000 : 4000
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, duration)

    return () => clearTimeout(timer)
  }, [toast, onDismiss])


  // Solución al error de TypeScript: Tipar explícitamente el objeto como Variants
  const variants: Variants = {
    initial: { opacity: 0, scale: 0.9, y: -20 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 400, damping: 25 } 
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
  }

  return (
    <motion.div
      layout
      variants={shouldReduceMotion ? undefined : variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        // Aplicando sugerencias de Tailwind (rounded-lg)
        'group pointer-events-auto flex w-full items-start justify-between gap-3 overflow-hidden rounded-lg border p-4 shadow-lg backdrop-blur-md',
        typeStyles[toast.type]
      )}
    >
      <div className="flex gap-3">
        {IconMap[toast.type]}
        <p className="text-sm leading-tight text-current pt-0.5">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        // Aplicando sugerencias de Tailwind (rounded-sm)
        className="shrink-0 rounded-sm p-1 opacity-60 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none"
        aria-label="Cerrar notificacion"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}