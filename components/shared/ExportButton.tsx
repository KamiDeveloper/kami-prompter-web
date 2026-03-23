'use client'
import * as React from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface ExportButtonProps {
  content: string
  type?: 'prd' | 'prompt' | 'template'
  title?: string
  className?: string
}

function generateMarkdown(content: string, opts: { title?: string; module: string; createdAt: Date }): string {
  const header = opts.title ? `# ${opts.title}\n\n` : ''
  const meta = `> Exportado desde Kami Prompter — ${opts.module.toUpperCase()} — ${opts.createdAt.toLocaleDateString('es-ES')}\n\n`
  return `${header}${meta}---\n\n${content}`
}

function generateFilename(type: string): string {
  const d = new Date()
  const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  return `kami-${type}-${ts}.md`
}

export function ExportButton({ content, type = 'prompt', title, className }: ExportButtonProps) {
  const handleExport = () => {
    const markdown = generateMarkdown(content, { title, module: type, createdAt: new Date() })
    const filename = generateFilename(type)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleExport} className={cn('gap-1.5', className)}>
      <Download size={14} />
      Exportar .md
    </Button>
  )
}
