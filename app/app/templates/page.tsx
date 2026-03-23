'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTemplates } from '@/hooks/use-templates'
import { useCategories } from '@/hooks/use-categories'
import { TemplateCard } from '@/components/templates/template-card'
import { ApiKeyBanner } from '@/components/shared/ApiKeyBanner'
import { Loader2, Plus, LayoutGrid, FileStack } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function TemplatesPage() {
  const router = useRouter()
  const { templates, loading, refetch } = useTemplates()
  const { categories } = useCategories()
  const [search, setSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      refetch({ searchQuery: search, categoryId: selectedCategory ?? undefined })
    }, 500)
    return () => clearTimeout(timer)
  }, [search, selectedCategory, refetch])

  return (
    <div className="flex flex-col gap-6 w-full min-h-[calc(100vh-8rem)]">
      <ApiKeyBanner />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library &amp; Templates</h1>
          <p className="text-text-secondary mt-1">
            Gestiona, evoluciona y reutiliza tus mejores prompts
          </p>
        </div>
        <Button size="lg" onClick={() => router.push('/app/templates/new')}>
          <Plus size={16} className="mr-2" />
          Nuevo Template
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Buscar</label>
            <Input
              placeholder="Buscar templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
              className="bg-surface"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Categorías</h3>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-left flex items-center gap-2 px-3 py-2 rounded-sm text-sm transition-colors ${!selectedCategory ? 'bg-accent-subtle text-accent font-medium' : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'}`}
            >
              <LayoutGrid size={14} className="shrink-0" />
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-left flex items-center gap-2 px-3 py-2 rounded-sm text-sm transition-colors ${selectedCategory === cat.id ? 'bg-accent-subtle text-accent font-medium' : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'}`}
              >
                {/* cat.emoji is user data from DB — acceptable to render */}
                <span className="text-text-muted text-xs w-4 shrink-0">{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="animate-spin text-accent" size={32} />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border rounded-xl bg-surface-raised/50">
              <div className="w-16 h-16 rounded-2xl bg-accent-subtle flex items-center justify-center mb-4 text-accent">
                <FileStack size={32} />
              </div>
              <h3 className="text-xl font-semibold text-text-primary">No hay templates</h3>
              <p className="text-text-secondary mb-6 max-w-sm">No encontramos ningún template con los filtros actuales. Crea uno nuevo para guardarlo en tu librería.</p>
              <Button variant="outline" onClick={() => router.push('/app/templates/new')}>
                <Plus size={14} className="mr-2" /> Crear Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
