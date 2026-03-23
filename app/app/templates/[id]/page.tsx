'use client'
import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Plus, GitBranch, Copy, Check, Download, Sparkles, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BranchTree } from '@/components/modules/templates/BranchTree'
import { TagInput } from '@/components/modules/templates/TagInput'
import { AdaptModal } from '@/components/modules/templates/AdaptModal'
import { ExportButton } from '@/components/shared/ExportButton'
import { useToast } from '@/hooks/use-toast'
import type { TemplateWithRelations, BranchSummary } from '@/types'
import Link from 'next/link'

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export default function TemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string
  const { toast } = useToast()

  const [template, setTemplate] = React.useState<TemplateWithRelations | null>(null)
  const [activeBranch, setActiveBranch] = React.useState<BranchSummary | null>(null)
  const [branchContent, setBranchContent] = React.useState('')
  const [tags, setTags] = React.useState<Array<{ tag: string; created_by: 'user' | 'ai' }>>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [adaptOpen, setAdaptOpen] = React.useState(false)
  const [newBranchLoading, setNewBranchLoading] = React.useState(false)
  const debouncedContent = useDebounce(branchContent, 800)

  // Load template
  React.useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/templates/${templateId}`)
        if (!res.ok) { router.push('/app/templates'); return }
        const { data } = await res.json() as { data: TemplateWithRelations }
        setTemplate(data)
        setTags(data.tags)
        const main = data.branches.find(b => b.is_main)
        if (main) setActiveBranch(main)
        setBranchContent(data.main_branch_content ?? '')
      } catch {
        toast('Error al cargar el template.', 'error')
        router.push('/app/templates')
      } finally {
        setLoading(false)
      }
    }
    loadTemplate()
  }, [templateId, router, toast])

  // Auto-save on debounced content change
  React.useEffect(() => {
    if (!activeBranch || !template || loading) return
    const saveContent = async () => {
      setSaving(true)
      try {
        await fetch(`/api/templates/${templateId}/branches/${activeBranch.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: debouncedContent }),
        })
      } catch { /* silent auto-save fail */ }
      finally { setSaving(false) }
    }
    saveContent()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent])

  const handleSelectBranch = async (branch: BranchSummary) => {
    setActiveBranch(branch)
    try {
      const res = await fetch(`/api/templates/${templateId}/branches/${branch.id}`)
      if (res.ok) {
        const { data } = await res.json() as { data: { content: string } }
        setBranchContent(data.content)
      }
    } catch { toast('Error al cargar rama.', 'error') }
  }

  const handleCreateBranch = async () => {
    if (!template) return
    setNewBranchLoading(true)
    try {
      const res = await fetch(`/api/templates/${templateId}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchName: `rama-${Date.now()}`,
          sourceContent: branchContent,
          parentBranchId: activeBranch?.id,
        }),
      })
      if (!res.ok) throw new Error('Error al crear rama')
      const { data } = await res.json() as { data: BranchSummary }
      setTemplate(prev => prev ? { ...prev, branches: [...prev.branches, data] } : prev)
      setActiveBranch(data)
      toast('Rama creada.', 'success')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error.', 'error')
    } finally {
      setNewBranchLoading(false)
    }
  }

  const handleDeleteBranch = async (branchId: string) => {
    try {
      await fetch(`/api/templates/${templateId}/branches/${branchId}`, { method: 'DELETE' })
      setTemplate(prev => prev ? { ...prev, branches: prev.branches.filter(b => b.id !== branchId) } : prev)
      if (activeBranch?.id === branchId) {
        const main = template?.branches.find(b => b.is_main)
        if (main) handleSelectBranch(main)
      }
    } catch { toast('Error al eliminar rama.', 'error') }
  }

  const handleSaveAsBranch = async (content: string) => {
    setAdaptOpen(false)
    setBranchContent(content)
    toast('Contenido adaptado cargado. Guarda para confirmar.', 'success')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(branchContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleUseInImprover = () => {
    sessionStorage.setItem('kami_improver_prefill', branchContent)
    router.push('/app/improver')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    )
  }

  if (!template) return null

  return (
    <div className="flex flex-col gap-0 w-full min-h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4 mb-6 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/app/templates" className="text-text-muted hover:text-text-primary transition-colors shrink-0" aria-label="Volver a Templates">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight truncate">{template.name}</h1>
          {template.is_nsfw && <Badge variant="warning" size="sm">NSFW</Badge>}
          {template.category && (
            <Badge variant="default" size="sm">{template.category.emoji} {template.category.name}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saving && <span className="text-xs text-text-muted flex items-center gap-1"><Save size={12} />Guardando...</span>}
          <Button variant="outline" size="sm" onClick={handleUseInImprover}>
            <Sparkles size={14} className="mr-1.5" /> Usar en Improver
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAdaptOpen(true)}>
            <Sparkles size={14} className="mr-1.5" /> Adaptar con IA
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={copied ? 'Copiado' : 'Copiar'}>
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          </Button>
          <ExportButton content={branchContent} type="template" title={template.name} />
        </div>
      </div>

      {/* Layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Branch sidebar */}
        <div className="w-48 shrink-0 hidden md:block">
          <BranchTree
            branches={template.branches}
            activeBranchId={activeBranch?.id ?? null}
            onSelect={handleSelectBranch}
            onCreateBranch={handleCreateBranch}
            onDeleteBranch={handleDeleteBranch}
            disabled={newBranchLoading}
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <Textarea
            value={branchContent}
            onChange={e => setBranchContent(e.target.value)}
            placeholder="Contenido del prompt..."
            fontMono
            showCount
            autoResize
            maxRows={30}
            className="flex-1 min-h-100"
          />

          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">Tags</p>
            <TagInput
              tags={tags}
              onChange={setTags}
              templateName={template.name}
              promptContent={branchContent}
            />
          </div>
        </div>
      </div>

      <AdaptModal
        isOpen={adaptOpen}
        onClose={() => setAdaptOpen(false)}
        originalPrompt={branchContent}
        onSaveAsBranch={handleSaveAsBranch}
      />
    </div>
  )
}
