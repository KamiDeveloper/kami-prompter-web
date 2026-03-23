'use client'
import * as React from 'react'
import { GitBranch, GitFork, Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils/cn'
import type { BranchSummary } from '@/types'

interface BranchTreeProps {
  branches: BranchSummary[]
  activeBranchId: string | null
  onSelect: (branch: BranchSummary) => void
  onCreateBranch: () => void
  onDeleteBranch: (branchId: string) => void
  disabled?: boolean
}

export function BranchTree({ branches, activeBranchId, onSelect, onCreateBranch, onDeleteBranch, disabled }: BranchTreeProps) {
  const mainBranch = branches.find(b => b.is_main)
  const otherBranches = branches.filter(b => !b.is_main)

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Ramas</span>
        <button
          onClick={onCreateBranch}
          disabled={disabled}
          className="p-1 rounded text-text-muted hover:text-accent hover:bg-accent-subtle transition-colors disabled:opacity-50"
          aria-label="Nueva rama"
        >
          <Plus size={13} />
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {mainBranch && (
          <BranchItem
            key={mainBranch.id}
            branch={mainBranch}
            isActive={activeBranchId === mainBranch.id}
            onSelect={onSelect}
            onDelete={onDeleteBranch}
            isMain={true}
          />
        )}
        {otherBranches.map(b => (
          <BranchItem
            key={b.id}
            branch={b}
            isActive={activeBranchId === b.id}
            onSelect={onSelect}
            onDelete={onDeleteBranch}
            isMain={false}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface BranchItemProps {
  branch: BranchSummary
  isActive: boolean
  onSelect: (b: BranchSummary) => void
  onDelete: (id: string) => void
  isMain: boolean
}

function BranchItem({ branch, isActive, onSelect, onDelete, isMain }: BranchItemProps) {
  const [hovered, setHovered] = React.useState(false)
  const Icon = isMain ? GitBranch : GitFork

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="group relative flex items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isActive && (
        <motion.div
          layoutId="branch-active"
          className="absolute inset-0 bg-accent-subtle rounded-md border-l-2 border-accent"
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      )}
      <button
        onClick={() => onSelect(branch)}
        className={cn(
          'relative z-10 flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left',
          isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
        )}
        aria-label={`Seleccionar rama ${branch.name}`}
      >
        <Icon size={12} className="shrink-0" />
        <span className="truncate">{branch.name}</span>
        {isMain && (
          <span className="ml-auto shrink-0 text-[10px] text-text-muted bg-surface-raised px-1 rounded">main</span>
        )}
      </button>
      {hovered && !isMain && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(branch.id) }}
          className="absolute right-1 z-20 p-1 rounded text-text-muted hover:text-error hover:bg-error-subtle transition-colors"
          aria-label={`Eliminar rama ${branch.name}`}
        >
          <Trash2 size={11} />
        </button>
      )}
    </motion.div>
  )
}
