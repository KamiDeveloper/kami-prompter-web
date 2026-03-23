'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useCategories } from '@/hooks/use-categories'
import { useSettingsStore } from '@/lib/store/settings.store'
import { useToast } from '@/hooks/use-toast'
import { TagInput } from '@/components/modules/templates/TagInput'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface CreateTemplateFormData {
  name: string
  description?: string
  categoryId?: string
  isNsfw?: boolean
  content: string
  tags?: Array<{ tag: string; created_by: 'user' | 'ai' }>
}

export default function NewTemplatePage() {
  const router = useRouter()
  const { categories } = useCategories()
  const showNsfw = useSettingsStore(state => state.showNsfw)
  const { toast } = useToast()
  const [creating, setCreating] = React.useState(false)

  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [categoryId, setCategoryId] = React.useState<string | null>(null)
  const [content, setContent] = React.useState('')
  const [tags, setTags] = React.useState<Array<{ tag: string; created_by: 'user' | 'ai' }>>([])
  const [isNsfw, setIsNsfw] = React.useState(false)
  const nameId = React.useId()
  const descId = React.useId()
  const catId = React.useId()
  const contentId = React.useId()

  const handleCreate = async (payload: CreateTemplateFormData) => {
    setCreating(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description || undefined,
          category_id: payload.categoryId || undefined,
          is_nsfw: payload.isNsfw ?? false,
          initialContent: payload.content,
          tags: payload.tags?.map((t) => t.tag) ?? [],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Error al crear la plantilla')
      }

      const { data } = await res.json() as { data: { template: { id: string } } }
      router.push(`/app/templates/${data.template.id}`)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Error al crear', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast('El nombre es requerido.', 'warning'); return }
    if (!content.trim()) { toast('El contenido del prompt es requerido.', 'warning'); return }

    try {
      await handleCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        content: content.trim(),
        tags,
        isNsfw: isNsfw,
      })
      toast('Template creado con éxito.', 'success')
    } catch {
      // noop
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/app/templates"
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Volver a Templates
        </Link>
      </div>

      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Template</h1>
        <p className="text-text-secondary mt-1">Crea una nueva plantilla de prompt reutilizable.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label htmlFor={nameId} className="block text-sm font-medium text-text-primary mb-1.5">
                Nombre <span className="text-error">*</span>
              </label>
              <Input
                id={nameId}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Generador de tests unitarios en Python"
                required
                disabled={creating}
              />
            </div>

            <div>
              <label htmlFor={descId} className="block text-sm font-medium text-text-primary mb-1.5">
                Descripción <span className="text-text-muted text-xs font-normal">(Opcional)</span>
              </label>
              <Input
                id={descId}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Breve descripción de cuándo usar este template"
                disabled={creating}
              />
            </div>

            <div>
              <label htmlFor={catId} className="block text-sm font-medium text-text-primary mb-1.5">
                Categoría <span className="text-text-muted text-xs font-normal">(Opcional)</span>
              </label>
              <select
                id={catId}
                value={categoryId ?? ''}
                onChange={e => setCategoryId(e.target.value || null)}
                disabled={creating}
                className="flex w-full h-9 items-center rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50"
              >
                <option value="">Sin categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contenido del prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <label htmlFor={contentId} className="block text-sm font-medium text-text-primary mb-1.5">
              Prompt <span className="text-error">*</span>
            </label>
            <Textarea
              id={contentId}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Escribe o pega el prompt aquí..."
              fontMono
              showCount
              autoResize
              maxRows={20}
              disabled={creating}
              className="min-h-50"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              tags={tags}
              onChange={setTags}
              templateName={name}
              promptContent={content}
              disabled={creating}
            />
          </CardContent>
        </Card>

        {showNsfw && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Contenido sensible (NSFW)</p>
                  <p className="text-xs text-text-secondary mt-0.5">Marca si este template contiene contenido para adultos.</p>
                </div>
                <Switch checked={isNsfw} onChange={setIsNsfw} disabled={creating} label="Marcar como NSFW" />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={creating || !name.trim() || !content.trim()}>
            {creating ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Sparkles size={15} className="mr-2" />}
            Crear Template
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={creating}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
