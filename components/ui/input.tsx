'use client'
import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils/cn'
import { fadeIn, shakeError } from '@/lib/animations'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  onIconRightClick?: () => void
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, hint, error, icon, iconRight, onIconRightClick, id, ...props },
    ref
  ) => {
    const defaultId = React.useId()
    const inputId = id ?? defaultId

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <motion.div
          animate={error ? 'animate' : 'initial'}
          variants={error ? shakeError : undefined}
          className="relative"
        >
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary',
              'transition-all duration-200 placeholder:text-text-muted',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-10',
              iconRight && 'pr-10',
              error
                ? 'border-error focus-visible:border-error focus-visible:ring-error-subtle'
                : 'border-border focus-visible:border-accent focus-visible:ring-accent-subtle'
            )}
            {...props}
          />
          {iconRight && (
            <div
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-text-muted',
                onIconRightClick ? 'cursor-pointer hover:text-text-primary transition-colors' : 'pointer-events-none'
              )}
              onClick={onIconRightClick}
            >
              {iconRight}
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
Input.displayName = 'Input'
