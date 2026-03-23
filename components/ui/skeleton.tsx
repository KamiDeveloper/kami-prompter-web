import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
  circle?: boolean
}

export function Skeleton({ className, lines = 1, circle = false, ...props }: SkeletonProps) {
  if (circle) {
    return (
      <div
        className={cn('skeleton-shimmer shrink-0 rounded-full inline-block', className)}
        {...props}
      />
    )
  }

  if (lines === 1) {
    return (
      <div
        className={cn('skeleton-shimmer h-4 w-full rounded-sm', className)}
        {...props}
      />
    )
  }

  // Multiply lines, varying width for aesthetic organic look
  return (
    <div className={cn('flex flex-col gap-2 w-full', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => {
        let widthClass = 'w-full'
        if (i === lines - 1) widthClass = 'w-[70%]'
        else if (i % 3 === 2) widthClass = 'w-[85%]'
        
        return (
          <div
            key={i}
            className={cn('skeleton-shimmer h-4 rounded-sm', widthClass)}
          />
        )
      })}
    </div>
  )
}
