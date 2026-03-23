'use client'

import * as React from 'react'
import { ToastContext, ToastMessage, ToastType } from '@/hooks/use-toast'
import { Toast } from './toast'
import { AnimatePresence } from 'motion/react'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const toast = React.useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => {
      // Keep max 3 toasts
      const next = [...prev, { id, message, type }]
      if (next.length > 3) {
        return next.slice(next.length - 3)
      }
      return next
    })
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div
        className="fixed z-50 flex flex-col gap-2 p-4 pointer-events-none md:top-4 md:right-4 md:bottom-auto md:left-auto top-4 left-1/2 -translate-x-1/2 md:translate-x-0 w-[calc(100%-32px)] md:w-auto max-w-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
