'use client'
import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface SectionNavProps {
  markdown: string
  className?: string
}

interface Section {
  id: string
  title: string
  level: number
}

function extractSections(markdown: string): Section[] {
  const lines = markdown.split('\n')
  const sections: Section[] = []
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/)
    if (match) {
      const id = match[2].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      sections.push({ id, title: match[2], level: match[1].length })
    }
  }
  return sections
}

export function SectionNav({ markdown, className }: SectionNavProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const sections = React.useMemo(() => extractSections(markdown), [markdown])

  if (sections.length === 0) return null

  const handleClick = (id: string) => {
    setActiveId(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className={cn('flex flex-col gap-0.5', className)} aria-label="Tabla de contenidos">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-2">Contenido</p>
      {sections.map(section => (
        <button
          key={section.id}
          onClick={() => handleClick(section.id)}
          className={cn(
            'text-left px-2 py-1 rounded-md text-xs transition-colors truncate',
            section.level === 1 ? 'font-semibold' : section.level === 2 ? 'pl-4' : 'pl-6',
            activeId === section.id
              ? 'text-accent bg-accent-subtle'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
          )}
        >
          {section.title}
        </button>
      ))}
    </nav>
  )
}
