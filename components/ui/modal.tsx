'use client'
import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { scaleIn } from '@/lib/animations'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  size?: ModalSize
  className?: string
  hideCloseButton?: boolean
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[540px]',
  lg: 'max-w-[680px]',
  xl: 'max-w-[860px]',
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  className,
  hideCloseButton = false,
}: ModalProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    // Prevent body scroll when open
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.body.style.overflow = 'auto'
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            {/* Modal Panel */}
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              className={cn(
                'relative w-full bg-surface border border-border rounded-xl shadow-2xl overflow-hidden',
                sizeClasses[size],
                className
              )}
            >
              {(title || !hideCloseButton) && (
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
                  {title && (
                    <h2 id="modal-title" className="text-base font-semibold text-text-primary">
                      {title}
                    </h2>
                  )}
                  {!hideCloseButton && (
                    <button
                      onClick={onClose}
                      className="ml-auto p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
                      aria-label="Cerrar modal"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}
              {children}
            </motion.div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  )
}
