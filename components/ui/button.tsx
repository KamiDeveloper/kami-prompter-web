'use client'
import * as React from 'react'
import { motion, HTMLMotionProps } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
  children?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-sm',
  secondary: 'bg-surface-raised border border-border text-text-primary hover:border-[var(--color-border-strong)]',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-raised',
  danger: 'bg-[var(--color-error-subtle)] text-error border border-[var(--color-error-subtle)] hover:bg-[rgba(239,68,68,0.2)]',
  outline: 'border border-accent-border text-accent-light hover:bg-accent-subtle',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs rounded-md',
  md: 'h-9 px-4 text-sm rounded-md',
  lg: 'h-11 px-6 text-base rounded-lg',
  icon: 'h-9 w-9 rounded-md justify-center p-0',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Component = motion.button
    const whileHoverStyles = variant === 'primary' && !disabled && !loading ? { scale: 1.01 } : undefined

    return (
      <Component
        ref={ref}
        disabled={disabled || loading}
        whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
        whileHover={whileHoverStyles}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin" size={16} />
          </div>
        )}
        <span
          className={cn(
            'inline-flex items-center gap-2',
            loading && 'opacity-0'
          )}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </span>
      </Component>
    )
  }
)
Button.displayName = 'Button'
