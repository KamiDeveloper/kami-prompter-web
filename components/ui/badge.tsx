import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'accent'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  size?: BadgeSize
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-raised text-text-primary border border-border',
  success: 'bg-[var(--color-success-subtle)] text-(--color-success) border border-[rgba(16,185,129,0.2)]',
  warning: 'bg-[var(--color-warning-subtle)] text-(--color-warning) border border-[rgba(245,158,11,0.2)]',
  error:   'bg-[var(--color-error-subtle)] text-error border border-[rgba(239,68,68,0.2)]',
  info:    'bg-[var(--color-info-subtle)] text-[var(--color-info)] border border-[rgba(59,130,246,0.2)]',
  accent:  'bg-accent-subtle text-accent-light border border-accent-border',
  outline: 'text-text-secondary border border-[var(--color-border-strong)]',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
}

export function Badge({ className, variant = 'default', size = 'md', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}
