'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { scaleIn } from '@/lib/animations'
import { cn } from '@/lib/utils/cn'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  delay?: number
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2'
}

export function Tooltip({ content, children, position = 'top', className, delay = 300 }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>(undefined)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  return (
    <div className="relative inline-flex">
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="inline-flex" // This ensures the wrapper behaves like the original trigger
      >
        {children}
      </span>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            role="tooltip"
            className={cn(
              'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-(--color-bg) bg-text-primary rounded-sm shadow-md whitespace-nowrap pointer-events-none',
              positionClasses[position],
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
