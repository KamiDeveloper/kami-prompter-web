'use client'
import * as React from 'react'
import { Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface CopyButtonProps {
  content: string
  size?: 'sm' | 'md'
  className?: string
}

export function CopyButton({ content, size = 'sm', className }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'md'}
      onClick={handleCopy}
      className={cn('gap-1.5', className)}
      aria-label={copied ? 'Copiado' : 'Copiar al portapapeles'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check size={14} className="text-success" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Copy size={14} />
          </motion.span>
        )}
      </AnimatePresence>
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  )
}
